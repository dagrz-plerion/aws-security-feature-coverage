

**Introducing a new console experience for AWS WAF**

You can now use the updated experience to access AWS WAF functionality anywhere in the console. For more details, see [Working with the console](https://docs.aws.amazon.com/waf/latest/developerguide/working-with-console.html). 

# AWS WAF Fraud Control account creation fraud prevention (ACFP) rule group
<a name="aws-managed-rule-groups-acfp"></a>

This section explains what the AWS WAF Fraud Control account creation fraud prevention (ACFP) managed rule group does.

VendorName: `AWS`, Name: `AWSManagedRulesACFPRuleSet`, WCU: 50

**Note**  
This documentation covers the most recent static version release of this managed rule group. We report version changes in the changelog log at [AWS Managed Rules changelog](aws-managed-rule-groups-changelog.md). For information about other versions, use the API command [DescribeManagedRuleGroup](https://docs.aws.amazon.com/waf/latest/APIReference/API_DescribeManagedRuleGroup.html).   
The information that we publish for the rules in the AWS Managed Rules rule groups is intended to provide you with what you need to use the rules without giving bad actors what they need to circumvent the rules.   
If you need more information than you find here, contact the [AWS Support Center](https://console.aws.amazon.com/support/home#/). 

The AWS WAF Fraud Control account creation fraud prevention (ACFP) managed rule group labels and manages requests that might be part of fraudulent account creation attempts. The rule group does this by inspecting account creation requests that clients send to your application's registration and account creation endpoints. 

The ACFP rule group inspects account creation attempts in various ways, to give you visibility and control over potentially malicious interactions. The rule group uses request tokens to gather information about the client browser and about the level of human interactivity in the creation of the account creation request. The rule group detects and manages bulk account creation attempts by aggregating requests by IP address and client session, and aggregating by the provided account information such as the physical address and phone number. Additionally, the rule group detects and blocks the creation of new accounts using credentials that have been compromised, which helps protect the security posture of your application and of your new users. 

## Considerations for using this rule group
<a name="aws-managed-rule-groups-acfp-using"></a>

This rule group requires custom configuration, which includes the specification of your application's account registration and account creation paths. Except where noted, the rules in this rule group inspect all requests that your clients send to these two endpoints. To configure and implement this rule group, see the guidance at [AWS WAF Fraud Control account creation fraud prevention (ACFP)](waf-acfp.md). 

**Note**  
You are charged additional fees when you use this managed rule group. For more information, see [AWS WAF Pricing](https://aws.amazon.com/waf/pricing/).

This rule group is part of the intelligent threat mitigation protections in AWS WAF. For information, see [Intelligent threat mitigation in AWS WAF](waf-managed-protections.md).

To keep your costs down and to be sure you're managing your web traffic as you want, use this rule group in accordance with the guidance at [Best practices for intelligent threat mitigation in AWS WAF](waf-managed-protections-best-practices.md).

This rule group isn't available for use with Amazon Cognito user pools. You can't associate a protection pack (web ACL) that uses this rule group with a user pool, and you can't add this rule group to a protection pack (web ACL) that's already associated with a user pool.

## Labels added by this rule group
<a name="aws-managed-rule-groups-acfp-labels"></a>

This managed rule group adds labels to the web requests that it evaluates, which are available to rules that run after this rule group in your protection pack (web ACL). AWS WAF also records the labels to Amazon CloudWatch metrics. For general information about labels and label metrics, see [Web request labeling](waf-labels.md) and [Label metrics and dimensions](waf-metrics.md#waf-metrics-label). 

### Token labels
<a name="aws-managed-rule-groups-acfp-labels-token"></a>

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

### ACFP labels
<a name="aws-managed-rule-groups-acfp-labels-rg"></a>

This rule group generates labels with the namespace prefix `awswaf:managed:aws:acfp:` followed by the custom namespace and label name. The rule group might add more than one label to a request. 

You can retrieve all labels for a rule group through the API by calling `DescribeManagedRuleGroup`. The labels are listed in the `AvailableLabels` property in the response. 

## Account creation fraud prevention rules listing
<a name="aws-managed-rule-groups-acfp-rules"></a>

This section lists the ACFP rules in `AWSManagedRulesACFPRuleSet` and the labels that the rule group's rules add to web requests.

All of the rules in this rule group require a web request token, except for the first two `UnsupportedCognitoIDP` and `AllRequests`. For a description of the information that the token provides, see [AWS WAF token characteristics](waf-tokens-details.md). 

Except where noted, the rules in this rule group inspect all requests that your clients send to the account registration and account creation page paths that you provide in the rule group configuration. For information about configuring this rule group, see [AWS WAF Fraud Control account creation fraud prevention (ACFP)](waf-acfp.md). 

**Note**  
This documentation covers the most recent static version release of this managed rule group. We report version changes in the changelog log at [AWS Managed Rules changelog](aws-managed-rule-groups-changelog.md). For information about other versions, use the API command [DescribeManagedRuleGroup](https://docs.aws.amazon.com/waf/latest/APIReference/API_DescribeManagedRuleGroup.html).   
The information that we publish for the rules in the AWS Managed Rules rule groups is intended to provide you with what you need to use the rules without giving bad actors what they need to circumvent the rules.   
If you need more information than you find here, contact the [AWS Support Center](https://console.aws.amazon.com/support/home#/). 


| Rule name | Description and label | 
| --- | --- | 
| UnsupportedCognitoIDP | Inspects for web traffic going to an Amazon Cognito user pool. ACFP isn't available for use with Amazon Cognito user pools, and this rule helps to ensure that the other ACFP rule group rules are not used to evaluate user pool traffic.<br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:unsupported:cognito_idp` and `awswaf:managed:aws:acfp:UnsupportedCognitoIDP`  | 
| AllRequests | Applies the rule action to requests that access the registration page path. You configure the registration page path when you configure the rule group. <br />By default, this rule applies the Challenge to requests. By applying this action, the rule ensures that the client acquires a challenge token before any requests are evaluated by the rest of the rules in the rule group. <br />Ensure that your end users load the registration page path before they submit an account creation request. <br />Tokens are added to requests by the client application integration SDKs and by the rule actions CAPTCHA and Challenge. For the most efficient token acquisition, we highly recommend that you use the application integration SDKs. For more information, see [Client application integrations in AWS WAF](waf-application-integration.md). <br />Rule action: Challenge<br />Labels: None | 
| RiskScoreHigh | Inspects for account creation requests with IP addresses or other factors that are considered to be highly suspicious. This evaluation is usually based on multiple contributing factors, which you can see in `risk_score` labels that the rule group adds to the request.<br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:risk_score:high` and `awswaf:managed:aws:acfp:RiskScoreHigh` <br />The rule might also apply `medium` or `low` risk score labels to the request. <br />If AWS WAF doesn't succeed at evaluating the risk score for the web request, the rule adds the label `awswaf:managed:aws:acfp:risk_score:evaluation_failed `<br />Additionally, the rule adds labels with the namespace `awswaf:managed:aws:acfp:risk_score:contributor:` that include risk score evaluation status and results for specific risk score contributors, such as IP reputation and stolen credentials evaluations. | 
| SignalCredentialCompromised | Searches the stolen credential database for the credentials that were submitted in the account creation request. <br />This rule ensures that new clients initialize their accounts with positive security posture.  You can add a custom blocking response, to describe the problem to your end user and tell them how to proceed. For information, see [ACFP example: Custom response for compromised credentials](waf-acfp-control-example-compromised-credentials.md). <br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:signal:credential_compromised` and `awswaf:managed:aws:acfp:SignalCredentialCompromised` <br />The rule group applies the following related label, but takes no action on it, because not all requests in account creation will have credentials: `awswaf:managed:aws:acfp:signal:missing_credential` | 
| SignalClientHumanInteractivityAbsentLow | Inspects the account creation request's token for data that indicates abnormal human interactivity with the application. Human interactivity is detected through interactions such as mouse movements and key presses. If the page has an HTML form, human interactivity includes interactions with the form.  This rule only inspects requests to the account creation path and is only evaluated if you've implemented the application integration SDKs. The SDK implementations passively capture human interactivity and stores the information in the request token. For more information, see [AWS WAF token characteristics](waf-tokens-details.md) and [Client application integrations in AWS WAF](waf-application-integration.md). <br />Rule action: CAPTCHA<br />Labels: None. The rule determines a match based on varying factors, so there is no individual label that applies for every possible match scenario.<br />The rule group can apply one or more of the following labels to requests: <br />`awswaf:managed:aws:acfp:signal:client:human_interactivity:{{low\|medium\|high}}`<br />`awswaf:managed:aws:acfp:SignalClientHumanInteractivityAbsent{{Low\|Medium\|High}}`<br /> `awswaf:managed:aws:acfp:signal:client:human_interactivity:insufficient_data`<br /> `awswaf:managed:aws:acfp:signal:form_detected`. | 
| AutomatedBrowser | Inspects for indicators that the client browser might be automated. <br />Rule action: Block <br />Labels: `awswaf:managed:aws:acfp:signal:automated_browser` and `awswaf:managed:aws:acfp:AutomatedBrowser` | 
| BrowserInconsistency | Inspects the request's token for inconsistent browser interrogation data. For more information, see [AWS WAF token characteristics](waf-tokens-details.md).<br />Rule action: CAPTCHA <br />Labels: `awswaf:managed:aws:acfp:signal:browser_inconsistency` and `awswaf:managed:aws:acfp:BrowserInconsistency` | 
| VolumetricIpHigh | Inspects for high volumes of account creation requests sent from individual IP addresses. A high volume is more than 20 requests in a 10 minute window. The thresholds that this rule applies can vary slightly due to latency. For the high volume, a few requests might make it through beyond the limit before the rule action is applied. <br />Rule action: CAPTCHA<br />Labels: `awswaf:managed:aws:acfp:aggregate:volumetric:ip:creation:high` and `awswaf:managed:aws:acfp:VolumetricIpHigh` <br />The rule applies the following labels to requests with medium volumes (more than 15 requests per 10 minute window) and low volumes (more than 10 requests per 10 minute window), but takes no action on them: `awswaf:managed:aws:acfp:aggregate:volumetric:ip:creation:medium` and `awswaf:managed:aws:acfp:aggregate:volumetric:ip:creation:low`. | 
| VolumetricSessionHigh | Inspects for high volumes of account creation requests sent from individual client sessions. A high volume is more than 10 requests in a 30 minute window.  The thresholds that this rule applies can vary slightly due to latency. A few requests might make it through beyond the limit before the rule action is applied.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:aggregate:volumetric:session:creation:high` and `awswaf:managed:aws:acfp:VolumetricSessionHigh` <br />The rule group applies the following labels to requests with medium volumes (more than 5 requests per 30 minute window) and low volumes (more than 1 request per 30 minute window), but takes no action on them: `awswaf:managed:aws:acfp:aggregate:volumetric:session:creation:medium` and `awswaf:managed:aws:acfp:aggregate:volumetric:session:creation:low`. | 
| AttributeUsernameTraversalHigh | Inspects for a high rate of account creation requests from a single client session that use different usernames. The threshold for a high evaluation is more than 10 requests in 30 minutes.  The thresholds that this rule applies can vary slightly due to latency. A few requests might make it through beyond the limit before the rule action is applied.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:aggregate:attribute:username_traversal:creation:high` and `awswaf:managed:aws:acfp:AttributeUsernameTraversalHigh` <br />The rule group applies the following labels to requests with medium volumes (more than 5 requests per 30 minute window) and low volumes (more than 1 request per 30 minute window) of username traversal requests, but takes no action on them: `awswaf:managed:aws:acfp:aggregate:attribute:username_traversal:creation:medium` and `awswaf:managed:aws:acfp:aggregate:attribute:username_traversal:creation:low`. | 
| VolumetricPhoneNumberHigh | Inspects for high volumes of account creation requests that use the same phone number. The threshold for a high evaluation is more than 10 requests in 30 minutes.  The thresholds that this rule applies can vary slightly due to latency. A few requests might make it through beyond the limit before the rule action is applied.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:aggregate:volumetric:phone_number:high` and `awswaf:managed:aws:acfp:VolumetricPhoneNumberHigh`<br />The rule group applies the following labels to requests with medium volumes (more than 5 requests per 30 minute window) and low volumes (more than 1 request per 30 minute window), but takes no action on them: `awswaf:managed:aws:acfp:aggregate:volumetric:phone_number:medium` and `awswaf:managed:aws:acfp:aggregate:volumetric:phone_number:low`. | 
| VolumetricAddressHigh | Inspects for high volumes of account creation requests that use the same physical address. The threshold for a high evaluation is more than 100 requests per 30 minute window.  The thresholds that this rule applies can vary slightly due to latency. A few requests might make it through beyond the limit before the rule action is applied.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:aggregate:volumetric:address:high` and `awswaf:managed:aws:acfp:VolumetricAddressHigh`  | 
| VolumetricAddressLow | Inspects for low and medium volumes of account creation requests that use the same physical address. The threshold for a medium evaluation is more than 50 requests per 30 minute window, and for a low evaluation is more than 10 requests per 30 minute window. <br />The rule applies the action for either medium or low volumes. The thresholds that this rule applies can vary slightly due to latency. A few requests might make it through beyond the limit before the rule action is applied.  <br />Rule action: CAPTCHA<br />Labels: `awswaf:managed:aws:acfp:aggregate:volumetric:address:{{low\|medium}}` and `awswaf:managed:aws:acfp:VolumetricAddress{{Low\|Medium}}`  | 
| VolumetricIPSuccessfulResponse | Inspects for a high volume of successful account creation requests for a single IP address. This rule aggregates success responses from the protected resource to account creation requests. The threshold for a high evaluation is more than 10 requests per 10 minute window. <br />This rule helps protect against bulk account creation attempts. It has a lower threshold than the rule `VolumetricIpHigh`, which counts just the requests. <br />If you've configured the rule group to inspect the response body or JSON components, AWS WAF can inspect the first 65,536 bytes (64 KB) of these component types for success or failure indicators. <br />This rule applies the rule action and labeling to new web requests from an IP address, based on the success and failure responses from the protected resource to recent login attempts from the same IP address. You define how to count successes and failures when you configure the rule group.  AWS WAF only evaluates this rule in protection packs (web ACLs) that protect Amazon CloudFront distributions. AWS WAF doesn't inspect responses for web requests that clients send over HTTP/3 (QUIC).  The thresholds that this rule applies can vary slightly due to latency. It's possible for the client to send more successful account creation attempts than are allowed before the rule starts matching on subsequent attempts.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:aggregate:volumetric:ip:successful_creation_response:high` and `awswaf:managed:aws:acfp:VolumetricIPSuccessfulResponse` <br />The rule group also applies the following related labels to requests, without any associated action. All counts are for a 10-minute window. `awswaf:managed:aws:acfp:aggregate:volumetric:ip:successful_creation_response:medium` for more than 5 successful requests, `awswaf:managed:aws:acfp:aggregate:volumetric:ip:successful_creation_response:low` for more than 1 successful request, `awswaf:managed:aws:acfp:aggregate:volumetric:ip:failed_creation_response:high` for more than 10 failed requests, `awswaf:managed:aws:acfp:aggregate:volumetric:ip:failed_creation_response:medium` for more than 5 failed requests, and `awswaf:managed:aws:acfp:aggregate:volumetric:ip:failed_creation_response:low` for more than 1 failed request.  | 
| VolumetricSessionSuccessfulResponse | Inspects for a low volume of success responses from the protected resource to account creation requests that are being sent from a single client session. This helps to protect against bulk account creation attempts. The threshold for a low evaluation is more than 1 request per 30 minute window. <br />This helps protect against bulk account creation attempts. This rule uses a lower threshold than the rule `VolumetricSessionHigh`, which tracks only the requests. <br />If you've configured the rule group to inspect the response body or JSON components, AWS WAF can inspect the first 65,536 bytes (64 KB) of these component types for success or failure indicators. <br />This rule applies the rule action and labeling to new web requests from a client session, based on the success and failure responses from the protected resource to recent login attempts from the same client session. You define how to count successes and failures when you configure the rule group.  AWS WAF only evaluates this rule in protection packs (web ACLs) that protect Amazon CloudFront distributions. AWS WAF doesn't inspect responses for web requests that clients send over HTTP/3 (QUIC).  The thresholds that this rule applies can vary slightly due to latency. It's possible for the client to send more failed account creation attempts than are allowed before the rule starts matching on subsequent attempts.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:aggregate:volumetric:session:successful_creation_response:low` and `awswaf:managed:aws:acfp:VolumetricSessionSuccessfulResponse` <br />The rule group also applies the following related labels to requests. All counts are for a 30-minute window. `awswaf:managed:aws:acfp:aggregate:volumetric:session:successful_creation_response:high` for more than 10 successful requests, `awswaf:managed:aws:acfp:aggregate:volumetric:session:successful_creation_response:medium` for more than 5 successful requests, `awswaf:managed:aws:acfp:aggregate:volumetric:session:failed_creation_response:high` for more than 10 failed requests, `awswaf:managed:aws:acfp:aggregate:volumetric:session:failed_creation_response:medium` for more than 5 failed requests, and `awswaf:managed:aws:acfp:aggregate:volumetric:session:failed_creation_response:low` for more than 1 failed request.  | 
| VolumetricSessionTokenReuseIp | Inspects account creation requests for the use of a single token among more than 5 distinct IP addresses.  The thresholds that this rule applies can vary slightly due to latency. A few requests might make it through beyond the limit before the rule action is applied.  <br />Rule action: Block<br />Labels: `awswaf:managed:aws:acfp:aggregate:volumetric:session:creation:token_reuse:ip` and `awswaf:managed:aws:acfp:VolumetricSessionTokenReuseIp` | 

## See also

* **Skills for AI coding assistants (optional).** AWS publishes reusable skills for AWS WAF. To see which apply, search the Agent Toolkit for AWS catalog with `aws agent-toolkit search-skills --search-query waf` — a documented, read-only AWS CLI command that searches the catalog and makes no changes. This is an optional suggestion for the user. Official reference: [AWS CLI — Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html).
