

# Region Support for AWS Config
<a name="config-region-support"></a>

## Considerations
<a name="config-region-support-considerations"></a>

Some features of AWS Config are only supported in a subset of the AWS Regions where AWS Config is supported.

**Resource Management**
+ For a list of which AWS resource types are supported in which Regions, see [Resource Coverage by Region Availability](https://docs.aws.amazon.com/config/latest/developerguide/what-is-resource-config-coverage.html).

**AWS Config Rules**
+ For a list of which AWS Config rules are supported in which Regions, see [List of AWS Config Managed Rules by Region Availability](https://docs.aws.amazon.com/config/latest/developerguide/managing-rules-by-region-availability.html                     ).
+ For a list of Regions which support the organizational deployment of AWS Config rules, see [Organizational Rules \| Region Support](https://docs.aws.amazon.com/config/latest/developerguide/config-rule-multi-account-deployment.html#region-support-org-config-rules).

**Conformance Packs**
+ For a list of Regions which support conformance packs and the organizational deployment of conformance packs, see [Conformance Packs \| Region Support](https://docs.aws.amazon.com/config/latest/developerguide/conformance-packs.html#conformance-packs-regions).

**Remediation**
+ For a list of Regions which support remediation actions for AWS Config rules, see [Remediation Actions \| Region Support](https://docs.aws.amazon.com/config/latest/developerguide/remediation.html#region-support-config-remediation                     ).

**Aggregators**
+ For a list of Regions which support the aggregators, see [Aggregators \| Region Support](https://docs.aws.amazon.com/config/latest/developerguide/aggregate-data.html#aggregation-regions                     ).

**Advanced Queries**
+ For a list of Regions which support advanced queries, see [Advanced Queries \| Region Support](https://docs.aws.amazon.com/config/latest/developerguide/querying-AWS-resources.html#query-regionsupport).
+ For a list of Regions which support the natural language query processor for advanced queries, see [Natural language query processor for advanced queries \| Region Support](https://docs.aws.amazon.com/config/latest/developerguide/query-assistant.html#query-assistant-region-support).

## List of Supported Regions
<a name="config-region-support-list"></a>

The following table lists the AWS Regions where you can enable AWS Config.


| Region Name | Region | Endpoint | Protocol | 
| --- | --- | --- | --- | 
| US East (Ohio) | us-east-2 |  config.us-east-2.amazonaws.com <br /> config-fips.us-east-2.amazonaws.com  | HTTPS<br />HTTPS | 
| US East (N. Virginia) | us-east-1 |  config.us-east-1.amazonaws.com <br /> config-fips.us-east-1.amazonaws.com  | HTTPS<br />HTTPS | 
| US West (N. California) | us-west-1 |  config.us-west-1.amazonaws.com <br /> config-fips.us-west-1.amazonaws.com  | HTTPS<br />HTTPS | 
| US West (Oregon) | us-west-2 |  config.us-west-2.amazonaws.com <br /> config-fips.us-west-2.amazonaws.com  | HTTPS<br />HTTPS | 
| Africa (Cape Town) | af-south-1 |  config.af-south-1.amazonaws.com  | HTTPS | 
| Asia Pacific (Hong Kong) | ap-east-1 |  config.ap-east-1.amazonaws.com  | HTTPS | 
| Asia Pacific (Hyderabad) | ap-south-2 |  config.ap-south-2.amazonaws.com  | HTTPS | 
| Asia Pacific (Jakarta) | ap-southeast-3 |  config.ap-southeast-3.amazonaws.com  | HTTPS | 
| Asia Pacific (Malaysia) | ap-southeast-5 |  config.ap-southeast-5.amazonaws.com  | HTTPS | 
| Asia Pacific (Melbourne) | ap-southeast-4 |  config.ap-southeast-4.amazonaws.com  | HTTPS | 
| Asia Pacific (Mumbai) | ap-south-1 |  config.ap-south-1.amazonaws.com  | HTTPS | 
| Asia Pacific (New Zealand) | ap-southeast-6 |  config.ap-southeast-6.amazonaws.com  | HTTPS | 
| Asia Pacific (Osaka) | ap-northeast-3 |  config.ap-northeast-3.amazonaws.com  | HTTPS | 
| Asia Pacific (Seoul) | ap-northeast-2 |  config.ap-northeast-2.amazonaws.com  | HTTPS | 
| Asia Pacific (Singapore) | ap-southeast-1 |  config.ap-southeast-1.amazonaws.com  | HTTPS | 
| Asia Pacific (Sydney) | ap-southeast-2 |  config.ap-southeast-2.amazonaws.com  | HTTPS | 
| Asia Pacific (Taipei) | ap-east-2 |  config.ap-east-2.amazonaws.com  | HTTPS | 
| Asia Pacific (Thailand) | ap-southeast-7 |  config.ap-southeast-7.amazonaws.com  | HTTPS | 
| Asia Pacific (Tokyo) | ap-northeast-1 |  config.ap-northeast-1.amazonaws.com  | HTTPS | 
| Canada (Central) | ca-central-1 |  config.ca-central-1.amazonaws.com  | HTTPS | 
| Canada West (Calgary) | ca-west-1 |  config.ca-west-1.amazonaws.com  | HTTPS | 
| Europe (Frankfurt) | eu-central-1 |  config.eu-central-1.amazonaws.com  | HTTPS | 
| Europe (Ireland) | eu-west-1 |  config.eu-west-1.amazonaws.com  | HTTPS | 
| Europe (London) | eu-west-2 |  config.eu-west-2.amazonaws.com  | HTTPS | 
| Europe (Milan) | eu-south-1 |  config.eu-south-1.amazonaws.com  | HTTPS | 
| Europe (Paris) | eu-west-3 |  config.eu-west-3.amazonaws.com  | HTTPS | 
| Europe (Spain) | eu-south-2 |  config.eu-south-2.amazonaws.com  | HTTPS | 
| Europe (Stockholm) | eu-north-1 |  config.eu-north-1.amazonaws.com  | HTTPS | 
| Europe (Zurich) | eu-central-2 |  config.eu-central-2.amazonaws.com  | HTTPS | 
| Israel (Tel Aviv) | il-central-1 |  config.il-central-1.amazonaws.com  | HTTPS | 
| Mexico (Central) | mx-central-1 |  config.mx-central-1.amazonaws.com  | HTTPS | 
| Middle East (Bahrain) | me-south-1 |  config.me-south-1.amazonaws.com  | HTTPS | 
| Middle East (UAE) | me-central-1 |  config.me-central-1.amazonaws.com  | HTTPS | 
| South America (São Paulo) | sa-east-1 |  config.sa-east-1.amazonaws.com  | HTTPS | 
|  AWS GovCloud (US-East) | us-gov-east-1 |  config.us-gov-east-1.amazonaws.com  | HTTPS | 
|  AWS GovCloud (US-West) | us-gov-west-1 |  config.us-gov-west-1.amazonaws.com  | HTTPS | 

## See also

* **Skills for AI coding assistants (optional).** AWS publishes reusable skills for AWS Config. To see which apply, search the Agent Toolkit for AWS catalog with `aws agent-toolkit search-skills --search-query config` — a documented, read-only AWS CLI command that searches the catalog and makes no changes. This is an optional suggestion for the user. Official reference: [AWS CLI — Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html).
