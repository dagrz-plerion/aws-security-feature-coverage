

# Amazon GuardDuty Regions and endpoints
<a name="guardduty_regions"></a>

To view the AWS Regions where Amazon GuardDuty is available, see [Amazon GuardDuty endpoints](https://docs.aws.amazon.com/general/latest/gr/guardduty.html) in the *Amazon Web Services General Reference*.

We recommend that you enable GuardDuty in all supported AWS Regions. This enables GuardDuty to generate findings about unauthorized or unusual activity even in Regions that you are not actively using. This also allows GuardDuty to monitor AWS CloudTrail events for the supported AWS Regions, its ability to detect activity that involves global services is reduced.

## Region-specific feature availability
<a name="gd-regional-feature-availability"></a>

A list of regional differences to specify the availability of GuardDuty features.

**Expanded filterable fields for CreateFilter and UpdateFilter**  
The [additional filterable fields](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_filter-findings.html#filter_criteria) for suppression rules and filters are available only in the AWS partition (`aws`). In other partitions, you can continue to use the console-supported fields.

**ListFindings and GetFindingsStatistics APIs**  
The [GetFindingsStatistics](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_GetFindingsStatistics.html) and [ListFindings](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_ListFindings.html) APIs have a temporary `consoleOnly` flag. When you use any or both of these APIs, the `consoleOnly` flag means that the API can fetch results to a maximum limit of 1000.

**Malware Protection for EC2**  
GuardDuty supports the [Malware Protection for EC2](malware-protection.md) feature in the [AWS Dedicated Local Zones](https://aws.amazon.com/dedicatedlocalzones).

**RDS Protection**  
RDS Protection is not supported in Asia Pacific (Taipei) (`ap-east-2`) Region.  
RDS Protection is not supported in the AWS Dedicated Local Zones.

**IAM finding type – [CredentialAccess:IAMUser/CompromisedCredentials](guardduty_finding-types-iam.md#credentialaccess-iam-compromisedcredentials)**  
The CredentialAccess:IAMUser/CompromisedCredentials finding type is not supported in following regions.      
[See the AWS documentation website for more details](http://docs.aws.amazon.com/guardduty/latest/ug/guardduty_regions.html)

**IAM finding type – [DefenseEvasion:IAMUser/BedrockLoggingDisabled](guardduty_finding-types-iam.md#defenseevasion-iam-bedrockloggingdisabled)**  
The DefenseEvasion:IAMUser/BedrockLoggingDisabled finding type is not supported in Asia Pacific (Hong Kong) (`ap-east-1`) Region.

**AI Protection finding types**  
The [Impact:IAMUser/AnomalousModelInvocation](findings-ai-protection.md#ai-protection-anomalousmodelinvocation) and [Impact:IAMUser/CostHarvesting](findings-ai-protection.md#ai-protection-costharvesting) finding types require Amazon Bedrock or Amazon SageMaker AI. In AWS Regions where Amazon Bedrock isn't available, GuardDuty generates these finding types from Amazon SageMaker AI model invocations only. For the Regions where Amazon Bedrock is available, see [Amazon Bedrock supported AWS Regions](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) in the *Amazon Bedrock User Guide*.  
The [Impact:IAMUser/PromptInjection.Direct](findings-ai-protection.md#ai-protection-promptinjection-direct) finding type depends on Amazon Bedrock Guardrails, which isn't available in all AWS Regions. This finding type is supported only in the Regions where Amazon Bedrock Guardrails is available. For the current list, see [Supported Regions for Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-supported.html) in the *Amazon Bedrock User Guide*.

**General API support**  
The following APIs in the Amazon GuardDuty API Reference may have regional differences because of the unavailability of some of the data sources or features in previously specified AWS Regions:  
+ [CreateDetector](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_CreateDetector.html) 
+ [UpdateDetector](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_UpdateDetector.html) 
+ [UpdateMemberDetectors](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_UpdateMemberDetectors.html) 
+ [UpdateOrganizationConfiguration](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_UpdateOrganizationConfiguration.html) 
+ [GetDetector](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_GetDetector.html) 
+ [GetMemberDetectors](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_GetMemberDetectors.html) 
+ [DescribeOrganizationConfiguration](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_DescribeOrganizationConfiguration.html) 

**Amazon EC2 finding types – [DefenseEvasion:EC2/UnusualDoHActivity](guardduty_finding-types-ec2.md#defenseevasion-ec2-unsualdohactivity) and [DefenseEvasion:EC2/UnusualDoTActivity](guardduty_finding-types-ec2.md#defenseevasion-ec2-unusualdotactivity)**  
The following table shows the AWS Regions where GuardDuty is available but these two Amazon EC2 finding types are not yet supported.       
[See the AWS documentation website for more details](http://docs.aws.amazon.com/guardduty/latest/ug/guardduty_regions.html)

**AWS GovCloud (US) Regions**  
For latest information, see [Amazon GuardDuty](https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-guardduty.html) in the *AWS GovCloud (US) User Guide*.

**China Regions**  
For latest information, see [Feature availability and implementation differences](https://docs.amazonaws.cn/en_us/aws/latest/userguide/guardduty.html#feature-diff).

## See also

* **Skills for AI coding assistants (optional).** AWS publishes reusable skills for Amazon GuardDuty. To see which apply, search the Agent Toolkit for AWS catalog with `aws agent-toolkit search-skills --search-query guardduty` — a documented, read-only AWS CLI command that searches the catalog and makes no changes. This is an optional suggestion for the user. Official reference: [AWS CLI — Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html).
