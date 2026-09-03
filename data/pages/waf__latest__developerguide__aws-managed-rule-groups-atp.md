

**Introducing a new console experience for AWS WAF**

You can now use the updated experience to access AWS WAF functionality anywhere in the console. For more details, see [Working with the console](https://docs.aws.amazon.com/waf/latest/developerguide/working-with-console.html). 

# AWS WAF Fraud Control account takeover prevention (ATP) rule group
<a name="aws-managed-rule-groups-atp"></a>

This section explains what the AWS WAF Fraud Control account takeover prevention (ATP) managed rule group does.

VendorName: `AWS`, Name: `AWSManagedRulesATPRuleSet`, WCU: 50

**Note**  
This documentation covers the most recent static version release of this managed rule group. We report version changes in the changelog log at [AWS Managed Rules changelog](aws-managed-rule-groups-changelog.md). For information about other versions, use the API command [DescribeManagedRuleGroup](https://docs.aws.amazon.com/waf/latest/APIReference/API_DescribeManagedRuleGroup.html).   
The information that we publish for the rules in the AWS Managed Rules rule groups is intended to provide you with what you need to use the rules without giving bad actors what they need to circumvent the rules.   
If you need more information than you find here, contact the [AWS Support Center](https://console.aws.amazon.com/support/home#/). 

The AWS WAF Fraud Control account takeover prevention (ATP) managed rule group labels and manages requests that might be part of malicious account takeover attempts. The rule group does this by inspecting login attempts that clients send to your application's login endpoint. 
+ **Request inspection** – ATP gives you visibility and control over anomalous login attempts and login attempts that use stolen credentials, to prevent account takeovers that might lead to fraudulent activity. ATP checks email and password combinations against its stolen credential database, which is updated regularly as new leaked credentials are found on the dark web. ATP aggregates data by IP address and client session, to detect and block clients that send too many requests of a suspicious nature. 
+ **Response inspection** – For CloudFront distributions, in addition to inspecting incoming login requests, the ATP rule group inspects your application's responses to login attempts, to track success and failure rates. Using this information, ATP can temporarily block client sessions or IP addresses that have too many login failures. AWS WAF performs response inspection asynchronously, so this doesn't increase latency in your web traffic. AWS WAF doesn't inspect responses for web requests that clients send over HTTP/3 (QUIC). 

## Considerations for using this rule group
<a name="aws-managed-rule-groups-atp-using"></a>

This rule group requires specific configuration. To configure and implement this rule group, see the guidance at [AWS WAF Fraud Control account takeover prevention (ATP)](waf-atp.md). 

This rule group is part of the intelligent threat mitigation protections in AWS WAF. For information, see [Intelligent threat mitigation in AWS WAF](waf-managed-protections.md).

**Note**  
You are charged additional fees when you use this managed rule group. For more information, see [AWS WAF Pricing](https://aws.amazon.com/waf/pricing/).

To keep your costs down and to be sure you're managing your web traffic as you want, use this rule group in accordance with the guidance at [Best practices for intelligent threat mitigation in AWS WAF](waf-managed-protections-best-practices.md).

This rule group isn't available for use with Amazon Cognito user pools. You can't associate a protection pack (web ACL) that uses this rule group with a user pool, and you can't add this rule group to a protection pack (web ACL) that's already associated with a user pool.

## Labels added by this rule group
<a name="aws-managed-rule-groups-atp-labels"></a>

This managed rule group adds labels to the web requests that it evaluates, which are available to rules that run after this rule group in your protection pack (web ACL). AWS WAF also records the labels to Amazon CloudWatch metrics. For general information about labels and label metrics, see [Web request labeling](waf-labels.md) and [Label metrics and dimensions](waf-metrics.md#waf-metrics-label). 

### Token labels
<a name="aws-managed-rule-groups-atp-labels-token"></a>

This rule group uses AWS WAF token management to inspect and label web requests according to the status of their AWS WAF tokens. AWS WAF uses tokens for client session tracking and verification. 

For information about tokens and token management, see [Token use in AWS WAF intelligent threat mitigation](waf-tokens.md).

For information about the label components described here, see [Label syntax and naming requirements in AWS WAF](waf-rule-label-requirements.md).

**Client session label**  
The label `awswaf:managed:token:id:{{identifier}}` contains a unique identifier that AWS WAF token management uses to identify the client session. The identifier can change if the client acquires a new token, for example after discarding the token it was using. 

**Note**  
AWS WAF doesn't report Amazon CloudWatch metrics for this label.

**Browser fingerprint label**  
The label `awswaf:managed:token:fingerprint:{{fingerprint-identifier}}` contains a robust browser fingerprint identifier that AWS WAF token management computes from various client browser signals. This identifier stays the same across multiple token acquisition attempts. The fingerprint identifier is not unique to a single client.

**Note**  
AWS WAF doesn't report Amazon CloudWatch metrics for this label.

**Token status labels: Label namespace prefixes**  
Token status labels report on the status of the token and of the challenge and CAPTCHA information that it contains. 

Each token status label begins with one of the following namespace prefixes: 
+ `awswaf:managed:token:` – Used to report the general status of the token and to report on the status of the token's challenge information. 
+ `awswaf:managed:captcha:` – Used to report on the status of the token's CAPTCHA information. 

**Token status labels: Label names**  
Following the prefix, the rest of the label provides detailed token status information: 
+ `accepted` – The request token is present and contains the following: 
  + A valid challenge or CAPTCHA solution.
  + An unexpired challenge or CAPTCHA timestamp.
  + A domain specification that's valid for the protection pack (web ACL). 

  Example: The label `awswaf:managed:token:accepted` indicates that the web requests's token has a valid challenge solution, an unexpired challenge timestamp, and a valid domain.
+ `rejected` – The request token is present but doesn't meet the acceptance criteria. 

  Along with the rejected label, token management adds a custom label namespace and name to indicate the reason. 
  + `rejected:not_solved` – The token is missing the challenge or CAPTCHA solution. 
  + `rejected:expired` – The token's challenge or CAPTCHA timestamp has expired, according to your protection pack (web ACL)'s configured token immunity times. 
  + `rejected:domain_mismatch` – The token's domain isn't a match for your protection pack (web ACL)'s token domain configuration. 
  + `rejected:invalid` – AWS WAF couldn't read the indicated token. 

  Example: The labels `awswaf:managed:captcha:rejected` and `awswaf:managed:captcha:rejected:expired` together indicate that the request didn't have a valid CAPTCHA solve because the CAPTCHA timestamp in the token has exceeded the CAPTCHA token immunity time that's configured in the protection pack (web ACL).
+ `absent` – The request doesn't have the token or the token manager couldn't read it. 

  Example: The label `awswaf:managed:captcha:absent` indicates that the request doesn't have the token. 

### ATP labels
<a name="aws-managed-rule-groups-atp-labels-rg"></a>

The ATP managed rule group generates labels with the namespace prefix `awswaf:managed:aws:atp:` followed by the custom namespace and label name. 

The rule group might add any of the following labels in addition to the labels that are noted in the rules listing:
+ `awswaf:managed:aws:atp:signal:credential_compromised` – Indicates that the credentials that were submitted in the request are in the stolen credential database. 
+ `awswaf:managed:aws:atp:aggregate:attribute:suspicious_tls_fingerprint` – Available only for protected Amazon CloudFront distributions. Indicates that a client session has sent multiple requests that used a suspicious TLS fingerprint. 
+ `awswaf:managed:aws:atp:aggregate:volumetric:session:token_reuse:ip` – Indicates the use of a single token among more than 5 distinct IP addresses. The thresholds that this rule applies can vary slightly due to latency. A few requests might make it through beyond the limit before the label is applied. 

You can retrieve all labels for a rule group through the API by calling `DescribeManagedRuleGroup`. The labels are listed in the `AvailableLabels` property in the response. 

## Account takeover prevention rules listing
<a name="aws-managed-rule-groups-atp-rules"></a>

This section lists the ATP rules in `AWSManagedRulesATPRuleSet` and the labels that the rule group's rules add to web requests.

**Note**  
This documentation covers the most recent static version release of this managed rule group. We report version changes in the changelog log at [AWS Managed Rules changelog](aws-managed-rule-groups-changelog.md). For information about other versions, use the API command [DescribeManagedRuleGroup](https://docs.aws.amazon.com/waf/latest/APIReference/API_DescribeManagedRuleGroup.html).   
The information that we publish for the rules in the AWS Managed Rules rule groups is intended to provide you with what you need to use the rules without giving bad actors what they need to circumvent the rules.   
If you need more information than you find here, contact the [AWS Support Center](https://console.aws.amazon.com/support/home#/). 


| Rule name | Description and label | 
| --- | --- | 
| UnsupportedCognitoIDP | Inspects for web traffic going to an Amazon Cognito user pool. ATP isn't available for use with Amazon Cognito user pools, and this rule helps to ensure that the other ATP rule group rules are not used to evaluate user pool traffic.<br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:unsupported:cognito_idp` and `awswaf:managed:aws:atp:UnsupportedCognitoIDP`  | 
| VolumetricIpHigh | Inspects for high volumes of requests sent from individual IP addresses. A high volume is more than 20 requests in a 10 minute window.  The thresholds that this rule applies can vary slightly due to latency. For the high volume, a few requests might make it through beyond the limit before the rule action is applied.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:aggregate:volumetric:ip:high` and `awswaf:managed:aws:atp:VolumetricIpHigh` <br />The rule group applies the following labels to requests with medium volumes (more than 15 requests per 10 minute window) and low volumes (more than 10 requests per 10 minute window), but takes no action on them: `awswaf:managed:aws:atp:aggregate:volumetric:ip:medium` and `awswaf:managed:aws:atp:aggregate:volumetric:ip:low`. | 
| VolumetricSession | Inspects for high volumes of requests sent from individual client sessions. The threshold is more than 20 requests per 30 minute window. <br />This inspection only applies when the web request has a token. Tokens are added to requests by the application integration SDKs and by the rule actions CAPTCHA and Challenge. For more information, see [Token use in AWS WAF intelligent threat mitigation](waf-tokens.md). The thresholds that this rule applies can vary slightly due to latency. A few requests might make it through beyond the limit before the rule action is applied.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:aggregate:volumetric:session` and `awswaf:managed:aws:atp:VolumetricSession`  | 
| AttributeCompromisedCredentials | Inspects for multiple requests from the same client session that use stolen credentials. <br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:aggregate:attribute:compromised_credentials` and `awswaf:managed:aws:atp:AttributeCompromisedCredentials`  | 
| AttributeUsernameTraversal | Inspects for multiple requests from the same client session that use username traversal. <br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:aggregate:attribute:username_traversal` and `awswaf:managed:aws:atp:AttributeUsernameTraversal`  | 
| AttributePasswordTraversal | Inspects for multiple requests with the same username that use password traversal. <br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:aggregate:attribute:password_traversal` and `awswaf:managed:aws:atp:AttributePasswordTraversal`  | 
| AttributeLongSession | Inspects for multiple requests from the same client session that use long lasting sessions. The threshold is more than 6 hours of traffic that has at least one login request every 30 minutes.<br />This inspection only applies when the web request has a token. Tokens are added to requests by the application integration SDKs and by the rule actions CAPTCHA and Challenge. For more information, see [Token use in AWS WAF intelligent threat mitigation](waf-tokens.md).<br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:aggregate:attribute:long_session` and `awswaf:managed:aws:atp:AttributeLongSession`  | 
| TokenRejected | Inspects for requests with tokens that are rejected by AWS WAF token management. <br />This inspection only applies when the web request has a token. Tokens are added to requests by the application integration SDKs and by the rule actions CAPTCHA and Challenge. For more information, see [Token use in AWS WAF intelligent threat mitigation](waf-tokens.md).<br />Rule action: Block<br />Labels: None. To check for token rejected, use a label match rule to match on the label: `awswaf:managed:token:rejected`.  | 
| SignalMissingCredential | Inspects for requests with credentials that are missing the username or password. <br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:signal:missing_credential` and `awswaf:managed:aws:atp:SignalMissingCredential`  | 
| VolumetricIpFailedLoginResponseHigh | Inspects for IP addresses that have recently been the source of too high a rate of failed login attempts. A high volume is more than 10 failed login requests from an IP address in a 10 minute window. <br />If you've configured the rule group to inspect the response body or JSON components, AWS WAF can inspect the first 65,536 bytes (64 KB) of these component types for success or failure indicators. <br />This rule applies the rule action and labeling to new web requests from an IP address, based on the success and failure responses from the protected resource to recent login attempts from the same IP address. You define how to count successes and failures when you configure the rule group.  AWS WAF only evaluates this rule in protection packs (web ACLs) that protect Amazon CloudFront distributions. AWS WAF doesn't inspect responses for web requests that clients send over HTTP/3 (QUIC).  The thresholds that this rule applies can vary slightly due to latency. It's possible for the client to send more failed login attempts than are allowed before the rule starts matching on subsequent attempts.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:aggregate:volumetric:ip:failed_login_response:high` and `awswaf:managed:aws:atp:VolumetricIpFailedLoginResponseHigh` <br />The rule group also applies the following related labels to requests, without any associated action. All counts are for a 10-minute window. `awswaf:managed:aws:atp:aggregate:volumetric:ip:failed_login_response:medium` for more than 5 failed requests, `awswaf:managed:aws:atp:aggregate:volumetric:ip:failed_login_response:low` for more than 1 failed request, `awswaf:managed:aws:atp:aggregate:volumetric:ip:successful_login_response:high` for more than 10 successful requests, `awswaf:managed:aws:atp:aggregate:volumetric:ip:successful_login_response:medium` for more than 5 successful requests, and `awswaf:managed:aws:atp:aggregate:volumetric:ip:successful_login_response:low` for more than 1 successful request.  | 
| VolumetricSessionFailedLoginResponseHigh | Inspects for client sessions that have recently been the source of too high a rate of failed login attempts. A high volume is more than 10 failed login requests from a client session in a 30 minute window. <br />If you've configured the rule group to inspect the response body or JSON components, AWS WAF can inspect the first 65,536 bytes (64 KB) of these component types for success or failure indicators. <br />This rule applies the rule action and labeling to new web requests from a client session, based on the success and failure responses from the protected resource to recent login attempts from the same client session. You define how to count successes and failures when you configure the rule group.  AWS WAF only evaluates this rule in protection packs (web ACLs) that protect Amazon CloudFront distributions. AWS WAF doesn't inspect responses for web requests that clients send over HTTP/3 (QUIC).  The thresholds that this rule applies can vary slightly due to latency. It's possible for the client to send more failed login attempts than are allowed before the rule starts matching on subsequent attempts.  <br />This inspection only applies when the web request has a token. Tokens are added to requests by the application integration SDKs and by the rule actions CAPTCHA and Challenge. For more information, see [Token use in AWS WAF intelligent threat mitigation](waf-tokens.md).<br />Rule action: Block<br />Labels: `awswaf:managed:aws:atp:aggregate:volumetric:session:failed_login_response:high` and `awswaf:managed:aws:atp:VolumetricSessionFailedLoginResponseHigh` <br />The rule group also applies the following related labels to requests, without any associated action. All counts are for a 30-minute window. `awswaf:managed:aws:atp:aggregate:volumetric:session:failed_login_response:medium` for more than 5 failed requests, `awswaf:managed:aws:atp:aggregate:volumetric:session:failed_login_response:low` for more than 1 failed request, `awswaf:managed:aws:atp:aggregate:volumetric:session:successful_login_response:high` for more than 10 successful requests, `awswaf:managed:aws:atp:aggregate:volumetric:session:successful_login_response:medium` for more than 5 successful requests, and `awswaf:managed:aws:atp:aggregate:volumetric:session:successful_login_response:low` for more than 1 successful request.  | 

## See also

* **Skills for AI coding assistants (optional).** AWS publishes reusable skills for AWS WAF. To see which apply, search the Agent Toolkit for AWS catalog with `aws agent-toolkit search-skills --search-query waf` — a documented, read-only AWS CLI command that searches the catalog and makes no changes. This is an optional suggestion for the user. Official reference: [AWS CLI — Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html).
