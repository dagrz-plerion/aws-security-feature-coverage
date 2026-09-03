

# Logging network activity events
<a name="logging-network-events-with-cloudtrail"></a>

CloudTrail network activity events enable VPC endpoint owners to record AWS API calls made using their VPC endpoints from a private VPC to the AWS service. Network activity events provide visibility into the resource operations performed within a VPC. For example, logging network activity events can help VPC endpoint owners detect when credentials from outside their organization attempt to access their VPC endpoints. 

You can log network activity events for the following services:
+ AWS AppConfig
+ AWS App Mesh
+ Amazon Athena
+ AWS B2B Data Interchange
+ AWS Backup gateway
+ Amazon Bedrock
+ Billing and Cost Management
+ AWS Pricing Calculator
+ AWS Cost Explorer
+ AWS Cloud Control API
+ AWS CloudHSM
+ AWS Cloud Map
+ AWS CloudFormation
+ AWS CloudTrail
+ Amazon CloudWatch
+ CloudWatch Application Signals
+ AWS CodeDeploy
+ Amazon Comprehend Medical
+ AWS Config
+ AWS Data Exports
+ Amazon Data Firehose
+ AWS Directory Service
+ Amazon DynamoDB
+ Amazon EC2
+ Amazon Elastic Container Service
+ Amazon Elastic File System
+ Elastic Load Balancing
+ Amazon EventBridge
+ Amazon EventBridge Scheduler
+ Amazon Fraud Detector
+ AWS Free Tier
+ Amazon FSx
+ AWS Glue
+ AWS HealthLake
+ AWS IoT FleetWise
+ AWS IoT Secure Tunneling
+ AWS Invoicing
+ Amazon Keyspaces (for Apache Cassandra)
+ AWS KMS
+ AWS Lake Formation
+ AWS Lambda
+ AWS License Manager
+ Amazon Lookout for Equipment
+ Amazon Lookout for Vision
+ Amazon Personalize
+ Amazon Q Business
+ Amazon Rekognition
+ Amazon Relational Database Service
+ Amazon S3
**Note**  
Amazon S3 [Multi-Region Access Points](https://docs.aws.amazon.com/AmazonS3/latest/userguide/MultiRegionAccessPointRequests.html) are not supported.
+ Amazon SageMaker AI
+ AWS Secrets Manager
+ Amazon Simple Notification Service
+ Amazon Simple Queue Service
+ Amazon Simple Workflow Service
+ AWS Storage Gateway
+ AWS Systems Manager Incident Manager
+ Amazon Textract
+ Amazon Transcribe
+ Amazon Translate
+ AWS Transform
+ Amazon Verified Permissions
+ Amazon WorkMail

You can configure both trails and event data stores to log network activity events.

By default, trails and event data stores do not log network activity events. Additional charges apply for network activity events. For more information, see [AWS CloudTrail Pricing](https://aws.amazon.com/cloudtrail/pricing/).

**Contents**
+ [Advanced event selector fields for network activity events](#logging-network-events)
+ [Logging network activity events with the AWS Management Console](#creating-network-event-selectors-with-the-console)
  + [Update an existing trail to log network activity events](#log-network-events-trail-console)
  + [Update an existing event data store to log network activity events](#log-network-events-lake-console)
+ [Logging network activity events with the AWS Command Line Interface](#creating-network-event-selectors-with-the-AWS-CLI)
  + [Examples: Logging network activity events for trails](#logging-network-events-CLI-trail-examples)
    + [Example: Log network activity events for CloudTrail operations](#logging-network-events-CLI-trail-all-ct)
    + [Example: Log `VpceAccessDenied` events for AWS KMS](#logging-network-events-CLI-trail-kms)
    + [Example: Log `VpceAccessDenied` events for Amazon S3](#logging-network-events-CLI-trail-s3)
    + [Example: Log EC2 `VpceAccessDenied` events over a specific VPC endpoint](#logging-network-events-CLI-trail-ec2)
    + [Example: Log all management events and network activity events for multiple event sources](#logging-network-events-CLI-trail-multiple)
  + [Examples: Logging network activity events for event data stores](#logging-network-events-CLI-eds-examples)
    + [Example: Log all network activity events for CloudTrail operations](#creating-network-events-eds-CLI-ct)
    + [Example: Log `VpceAccessDenied` events for AWS KMS](#creating-network-events-eds-CLI-kms)
    + [Example: Log EC2 `VpceAccessDenied` events over a specific VPC endpoint](#creating-network-events-eds-CLI-ec2)
    + [Example: Log `VpceAccessDenied` events for Amazon S3](#creating-network-events-eds-CLI-s3)
    + [Example: Log all management events and network activity events for multiple event sources](#creating-network-events-eds-CLI-multiple)
+ [Logging events with the AWS SDKs](#logging-network-events-with-the-AWS-SDKs)

## Advanced event selector fields for network activity events
<a name="logging-network-events"></a>

You configure advanced event selectors to log network activity events by specifying the event source for which you want to log activity. You can configure advanced event selectors using the AWS SDKs, AWS CLI, or CloudTrail console.

The following advanced event selector fields are required to log network activity events:
+ `eventCategory` – To log network activity events, the value must be `NetworkActivity`. `eventCategory` can only use the `Equals` operator.
+ `eventSource` – The event source for which you want to log network activity events. `eventSource` can only use the `Equals` operator. If you want to log network activity events for multiple event sources, you must create a separate field selector for each event source.

  Valid values include:
  + `aco-automation.amazonaws.com`
  + `appconfig.amazonaws.com`
  + `application-signals.amazonaws.com`
  + `appmesh.amazonaws.com`
  + `athena.amazonaws.com`
  + `b2bi.amazonaws.com`
  + `backup-gateway.amazonaws.com`
  + `bcm-data-exports.amazonaws.com`
  + `bcm-pricing-calculator.amazonaws.com`
  + `bedrock-agentcore.amazonaws.com`
  + `bedrock.amazonaws.com`
  + `billing.amazonaws.com`
  + `cassandra.amazonaws.com`
  + `ce.amazonaws.com`
  + `cloudcontrolapi.amazonaws.com`
  + `cloudformation.amazonaws.com`
  + `cloudhsm.amazonaws.com`
  + `cloudoptimization.amazonaws.com`
  + `cloudtrail.amazonaws.com`
  + `codedeploy.amazonaws.com`
  + `comprehend.amazonaws.com`
  + `comprehendmedical.amazonaws.com`
  + `config.amazonaws.com`
  + `ds.amazonaws.com`
  + `dynamodb.amazonaws.com`
  + `ec2.amazonaws.com`
  + `ecs.amazonaws.com`
  + `elasticfilesystem.amazonaws.com`
  + `elasticloadbalancing.amazonaws.com`
  + `events.amazonaws.com`
  + `firehose.amazonaws.com`
  + `frauddetector.amazonaws.com`
  + `freetier.amazonaws.com`
  + `fsx.amazonaws.com`
  + `glue.amazonaws.com`
  + `healthlake.amazonaws.com`
  + `invoicing.amazonaws.com`
  + `iot.amazonaws.com`
  + `iotfleetwise.amazonaws.com`
  + `iotsecuredtunneling.amazonaws.com`
  + `kms.amazonaws.com`
  + `lakeformation.amazonaws.com`
  + `lambda.amazonaws.com`
  + `license-manager.amazonaws.com`
  + `lookoutequipment.amazonaws.com`
  + `lookoutvision.amazonaws.com`
  + `monitoring.amazonaws.com`
  + `nova-act.amazonaws.com`
  + `personalize.amazonaws.com`
  + `qbusiness.amazonaws.com`
  + `rds.amazonaws.com`
  + `rekognition.amazonaws.com`
  + `rolesanywhere.amazonaws.com`
  + `s3.amazonaws.com`
  + `sagemaker.amazonaws.com`
  + `scheduler.amazonaws.com`
  + `secretsmanager.amazonaws.com`
  + `servicediscovery.amazonaws.com`
  + `sns.amazonaws.com`
  + `sqs.amazonaws.com`
  + `ssm-contacts.amazonaws.com`
  + `ssm.amazonaws.com`
  + `storagegateway.amazonaws.com`
  + `swf.amazonaws.com`
  + `textract.amazonaws.com`
  + `transcribe.amazonaws.com`
  + `transcribestreaming.amazonaws.com`
  + `transform-agents.amazonaws.com`
  + `transform-custom.amazonaws.com`
  + `transform.amazonaws.com`
  + `translate.amazonaws.com`
  + `user-subscriptions.amazonaws.com`
  + `verifiedpermissions.amazonaws.com`
  + `voiceid.amazonaws.com`
  + `workmail.amazonaws.com`
  + `workmailmessageflow.amazonaws.com`

The following advanced event selector fields are optional:
+ `eventName` – The requested action that you want to filter on. For example, `CreateKey` or `ListKeys`. `eventName` can use any operator.
+ `errorCode` – The requested error code that you want to filter on. Currently, the only valid `errorCode` is `VpceAccessDenied`. You can use only the `Equals` operator with `errorCode`.
+ `vpcEndpointId` – Identifies the VPC endpoint that the operation passed through. You can use any operator with `vpcEndpointId`.
+ `userIdentity.arn` – Include or exclude events for actions taken by specific IAM identities. For more information, see [CloudTrail userIdentity element](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-user-identity.html). You can use any operator with `userIdentity.arn`. CloudTrail supports this field for trails only. You cannot filter network activity events on `userIdentity.arn` for event data stores.

Network activity events are not logged by default when you create a trail or event data store. To record CloudTrail network activity events, you must explicitly configure each event source for which you want to collect activity.

Additional charges apply for logging network activity events. For CloudTrail pricing, see [AWS CloudTrail Pricing](https://aws.amazon.com/cloudtrail/pricing/).

## Logging network activity events with the AWS Management Console
<a name="creating-network-event-selectors-with-the-console"></a>

You can update an existing trail or event data store to log network activity events using the console.

**Topics**
+ [Update an existing trail to log network activity events](#log-network-events-trail-console)
+ [Update an existing event data store to log network activity events](#log-network-events-lake-console)

### Update an existing trail to log network activity events
<a name="log-network-events-trail-console"></a>

Use the following procedure to update an existing trail to log network activity events.

**Note**  
Additional charges apply for logging network activity events. For CloudTrail pricing, see [AWS CloudTrail Pricing](https://aws.amazon.com/cloudtrail/pricing/).

1. Sign in to the AWS Management Console and open the CloudTrail console at [https://console.aws.amazon.com/cloudtrail/](https://console.aws.amazon.com/cloudtrail/).

1. In the left navigation pane of the CloudTrail console, open the **Trails** page, and choose a trail name.

1. If your trail is logging data events using basic event selectors, you’ll need to switch to advanced event selectors to log network activity events.

   Take these steps to switch to advanced event selectors:

   1. In the **Data events** area, take note of the current data event selectors. Switching to advanced event selectors will clear out any existing data event selectors.

   1. Choose **Edit** and then choose **Switch to advanced event selectors**.

   1. Reapply your data event selections using advanced event selectors. For more information, see [Updating an existing trail to log data events with advanced event selectors using the console](logging-data-events-with-cloudtrail.md#logging-data-events-with-the-cloudtrail-console-adv).

1. In **Network activity events**, choose **Edit**.

   To log network activity events, take the following steps:

   1. From **Network activity event source**, choose the source for network activity events.

   1. In **Log selector template**, choose a template. You can choose to log all network activity events, log all network activity access denied events, or choose **Custom** to build a custom log selector to filter on multiple fields, such as `eventName` and `vpcEndpointId`.

   1. (Optional) Enter a name to identify the selector. The selector name is listed as **Name** in the advanced event selector and is viewable if you expand the **JSON view**.

   1. In **Advanced event selectors** build expressions by choosing values for **Field**, **Operator**, and **Value**. You can skip this step if you are using a predefined log template.

      1. For excluding or including network activity events, you can choose from the following fields in the console.
         + **`eventName`** – You can use any operator with `eventName`. You can use it to include or exclude any event, such as `CreateKey`.
         + **`errorCode`** – You can use it to filter on an error code. Currently, the only supported `errorCode` is `VpceAccessDenied`.
         +  **`vpcEndpointId`** – Identifies the VPC endpoint that the operation passed through. You can use any operator with `vpcEndpointId`. 

      1. For each field, choose **\+ Condition** to add as many conditions as you need, up to a maximum of 500 specified values for all conditions. 

      1. Choose **\+ Field** to add additional fields as required. To avoid errors, do not set conflicting or duplicate values for fields. 

   1. To add another event source for which you want to log network activity events, choose **Add network activity event selector**.

   1. Optionally, expand **JSON view** to see your advanced event selectors as a JSON block.

1. Choose **Save changes** to save your changes.

### Update an existing event data store to log network activity events
<a name="log-network-events-lake-console"></a>

Use the following procedure to update an existing event data store to log network activity events.

**Note**  
You can only log network activity events on event data stores of type **CloudTrail events**.

1. Sign in to the AWS Management Console and open the CloudTrail console at [https://console.aws.amazon.com/cloudtrail/](https://console.aws.amazon.com/cloudtrail/).

1. In the left navigation pane of the CloudTrail console, under **Lake**, choose **Event data stores**.

1. Choose the event data store name.

1. In **Network activity events**, choose **Edit**.

   To log network activity events, take the following steps:

   1. From **Network activity event source**, choose the source for network activity events.

   1. In **Log selector template**, choose a template. You can choose to log all network activity events, log all network activity access denied events, or choose **Custom** to build a custom log selector to filter on multiple fields, such as `eventName` and `vpcEndpointId`.

   1. (Optional) Enter a name to identify the selector. The selector name is listed as **Name** in the advanced event selector and is viewable if you expand the **JSON view**.

   1. In **Advanced event selectors** build expressions by choosing values for **Field**, **Operator**, and **Value**. You can skip this step if you are using a predefined log template.

      1. For excluding or including network activity events, you can choose from the following fields in the console.
         + **`eventName`** – You can use any operator with `eventName`. You can use it to include or exclude any event, such as `CreateKey`.
         + **`errorCode`** – You can use it to filter on an error code. Currently, the only supported `errorCode` is `VpceAccessDenied`.
         +  **`vpcEndpointId`** – Identifies the VPC endpoint that the operation passed through. You can use any operator with `vpcEndpointId`. 

      1. For each field, choose **\+ Condition** to add as many conditions as you need, up to a maximum of 500 specified values for all conditions. 

      1. Choose **\+ Field** to add additional fields as required. To avoid errors, do not set conflicting or duplicate values for fields. 

   1. To add another event source for which you want to log network activity events, choose **Add network activity event selector**.

   1. Optionally, expand **JSON view** to see your advanced event selectors as a JSON block.

1. Choose **Save changes** to save your changes.

## Logging network activity events with the AWS Command Line Interface
<a name="creating-network-event-selectors-with-the-AWS-CLI"></a>

You can configure your trails or event data stores to log network activity events using the AWS CLI.

**Topics**
+ [Examples: Logging network activity events for trails](#logging-network-events-CLI-trail-examples)
+ [Examples: Logging network activity events for event data stores](#logging-network-events-CLI-eds-examples)

### Examples: Logging network activity events for trails
<a name="logging-network-events-CLI-trail-examples"></a>

You can configure your trails to log network activity events using the AWS CLI. Run the [**put-event-selectors**](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/cloudtrail/put-event-selectors.html) command to configure the advanced event selectors for your trail. 

 To see whether your trail is logging network activity events, run the [`get-event-selectors`](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/cloudtrail/get-event-selectors.html) command. 

**Topics**
+ [Example: Log network activity events for CloudTrail operations](#logging-network-events-CLI-trail-all-ct)
+ [Example: Log `VpceAccessDenied` events for AWS KMS](#logging-network-events-CLI-trail-kms)
+ [Example: Log `VpceAccessDenied` events for Amazon S3](#logging-network-events-CLI-trail-s3)
+ [Example: Log EC2 `VpceAccessDenied` events over a specific VPC endpoint](#logging-network-events-CLI-trail-ec2)
+ [Example: Log all management events and network activity events for multiple event sources](#logging-network-events-CLI-trail-multiple)

#### Example: Log network activity events for CloudTrail operations
<a name="logging-network-events-CLI-trail-all-ct"></a>

The following example shows how to configure your trail to include all network activity events for CloudTrail API operations, such as `CreateTrail` and `CreateEventDataStore` calls. The value for the `eventSource` field is `cloudtrail.amazonaws.com`.

```
aws cloudtrail put-event-selectors /
--trail-name {{TrailName}} /
--region {{region}} /
--advanced-event-selectors '[
    {
        "Name": "Audit all CloudTrail API calls through VPC endpoints",
        "FieldSelectors": [
            {
                "Field": "eventCategory",
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["cloudtrail.amazonaws.com"]
            }
        ]
    }
]'
```

 The command returns the following example output. 

```
{
    "TrailARN": "arn:aws:cloudtrail:us-east-1:111122223333:trail/TrailName",
    "AdvancedEventSelectors": [
        {
            "Name": "Audit all CloudTrail API calls through VPC endpoints",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "cloudtrail.amazonaws.com"
                    ]
                }
            ]
        }
    ]
}
```

#### Example: Log `VpceAccessDenied` events for AWS KMS
<a name="logging-network-events-CLI-trail-kms"></a>

The following example shows how to configure your trail to include `VpceAccessDenied` events for AWS KMS. This example sets the `errorCode` field equal to `VpceAccessDenied` events and the `eventSource` field equal to `kms.amazonaws.com`.

```
aws cloudtrail put-event-selectors \
--region {{region}} /
--trail-name {{TrailName}} /
--advanced-event-selectors '[
    {
        "Name": "Audit AccessDenied AWS KMS events through VPC endpoints",
        "FieldSelectors": [
            {
                "Field": "eventCategory",
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["kms.amazonaws.com"]
            },
            {
                "Field": "errorCode",
                "Equals": ["VpceAccessDenied"]
            }
        ]
    }
]'
```

The command returns the following example output. 

```
{
    "TrailARN": "arn:aws:cloudtrail:us-east-1:111122223333:trail/TrailName",
    "AdvancedEventSelectors": [
        {
            "Name": "Audit AccessDenied AWS KMS events through VPC endpoints",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "kms.amazonaws.com"
                    ]
                },
                {
                    "Field": "errorCode",
                    "Equals": [
                        "VpceAccessDenied"
                    ]
                }
            ]
        }
    ]
}
```

#### Example: Log `VpceAccessDenied` events for Amazon S3
<a name="logging-network-events-CLI-trail-s3"></a>

The following example shows how to configure your trail to include `VpceAccessDenied` events for Amazon S3. This example sets the `errorCode` field equal to `VpceAccessDenied` events and the `eventSource` field equal to `s3.amazonaws.com`.

```
aws cloudtrail put-event-selectors \
--region {{region}} /
--trail-name {{TrailName}} /
--advanced-event-selectors '[
    {
        "Name": "Log S3 access denied network activity events",
        "FieldSelectors": [
            {
                "Field": "eventCategory",
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["s3.amazonaws.com"]
            },
            {
                "Field": "errorCode",
                "Equals": ["VpceAccessDenied"]
            }
        ]
    }
]'
```

The command returns the following example output. 

```
{
    "TrailARN": "arn:aws:cloudtrail:us-east-1:111122223333:trail/TrailName",
    "AdvancedEventSelectors": [
        {
            "Name": "Log S3 access denied network activity events",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "s3.amazonaws.com"
                    ]
                },
                {
                    "Field": "errorCode",
                    "Equals": [
                        "VpceAccessDenied"
                    ]
                }
            ]
        }
    ]
}
```

#### Example: Log EC2 `VpceAccessDenied` events over a specific VPC endpoint
<a name="logging-network-events-CLI-trail-ec2"></a>

The following example shows how to configure your trail to include `VpceAccessDenied` events for Amazon EC2 for a specific VPC endpoint. This example sets the `errorCode` field equal to `VpceAccessDenied` events, the `eventSource` field equal to `ec2.amazonaws.com`, and the `vpcEndpointId` equal to the VPC endpoint of interest.

```
aws cloudtrail put-event-selectors \
--region {{region}} /
--trail-name {{TrailName}} /
--advanced-event-selectors '[
    {
        "Name": "Audit AccessDenied EC2 events over a specific VPC endpoint",
        "FieldSelectors": [
            {
                "Field": "eventCategory",
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["ec2.amazonaws.com"]
            },
            {
                "Field": "errorCode",
                "Equals": ["VpceAccessDenied"]
            },
            {
                "Field": "vpcEndpointId",
                "Equals": ["vpce-example8c1b6b9b7"]
            }
        ]
    }
]'
```

The command returns the following example output. 

```
{
    "TrailARN": "arn:aws:cloudtrail:us-east-1:111122223333:trail/TrailName",
    "AdvancedEventSelectors": [
        {
            "Name": "Audit AccessDenied EC2 events over a specific VPC endpoint",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "ec2.amazonaws.com"
                    ]
                },
                {
                    "Field": "errorCode",
                    "Equals": [
                        "VpceAccessDenied"
                    ]
                },
                {
                    "Field": "vpcEndpointId",
                    "Equals": [
                        "vpce-example8c1b6b9b7"
                    ]
                }
            ]
        }
    ]
}
```

#### Example: Log all management events and network activity events for multiple event sources
<a name="logging-network-events-CLI-trail-multiple"></a>

The following example configures a trail to log management events and all network activity events for the CloudTrail, Amazon EC2, AWS KMS, AWS Secrets Manager, and Amazon S3 event sources.

```
aws cloudtrail put-event-selectors \
--region {{region}} /
--trail-name {{TrailName}} /
--advanced-event-selectors '[
    {
        "Name": "Log all management events",
        "FieldSelectors": [
            { 
                "Field": "eventCategory", 
                "Equals": ["Management"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for CloudTrail APIs",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource", 
                "Equals": ["cloudtrail.amazonaws.com"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for EC2",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["ec2.amazonaws.com"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for KMS",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource", 
                "Equals": ["kms.amazonaws.com"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for S3",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource", 
                "Equals": ["s3.amazonaws.com"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for Secrets Manager",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["secretsmanager.amazonaws.com"]
            }
        ]
    }
]'
```

The command returns the following example output. 

```
{
    "TrailARN": "arn:aws:cloudtrail:us-east-1:123456789012:trail/TrailName",
    "AdvancedEventSelectors": [
        {
            "Name": "Log all management events",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "Management"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for CloudTrail APIs",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "cloudtrail.amazonaws.com"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for EC2",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "ec2.amazonaws.com"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for KMS",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "kms.amazonaws.com"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for S3",
            "FieldSelectors": [
                {
                    "Field": "eventCategory", 
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource", 
                    "Equals": [
                        "s3.amazonaws.com"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for Secrets Manager",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "secretsmanager.amazonaws.com"
                    ]
                }
            ]
        }
    ]
}
```

### Examples: Logging network activity events for event data stores
<a name="logging-network-events-CLI-eds-examples"></a>

You can configure your event data stores to include network activity events using the AWS CLI. Use the [`create-event-data-store`](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/cloudtrail/create-event-data-store.html) command to create a new event data store to log network activity events. Use the [`update-event-data-store`](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/cloudtrail/update-event-data-store.html) command to update the advanced event selectors for an existing event data store.

To see whether your event data store includes network activity events, run the [`get-event-data-store`](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/cloudtrail/get-event-data-store.html) command. 

```
aws cloudtrail get-event-data-store --event-data-store {{EventDataStoreARN}}
```

**Topics**
+ [Example: Log all network activity events for CloudTrail operations](#creating-network-events-eds-CLI-ct)
+ [Example: Log `VpceAccessDenied` events for AWS KMS](#creating-network-events-eds-CLI-kms)
+ [Example: Log EC2 `VpceAccessDenied` events over a specific VPC endpoint](#creating-network-events-eds-CLI-ec2)
+ [Example: Log `VpceAccessDenied` events for Amazon S3](#creating-network-events-eds-CLI-s3)
+ [Example: Log all management events and network activity events for multiple event sources](#creating-network-events-eds-CLI-multiple)

#### Example: Log all network activity events for CloudTrail operations
<a name="creating-network-events-eds-CLI-ct"></a>

The following example shows how to create an event data store that includes all network activity events related to CloudTrail operations, such as calls to `CreateTrail` and `CreateEventDataStore`. The value for the `eventSource` field is set to `cloudtrail.amazonaws.com`.

```
aws cloudtrail create-event-data-store \
--name "{{EventDataStoreName}}" \
--advanced-event-selectors '[
    {
        "Name": "Audit all CloudTrail API calls over VPC endpoint",
        "FieldSelectors": [
            {
                "Field": "eventCategory",
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["cloudtrail.amazonaws.com"]
            }
        ]
    }
]'
```

The command returns the following example output.

```
{
    "EventDataStoreArn": "arn:aws:cloudtrail:us-east-1:111122223333:eventdatastore/EXAMPLE492-301f-4053-ac5e-EXAMPLE441aa",
    "Name": "EventDataStoreName",
    "Status": "ENABLED",
    "AdvancedEventSelectors": [
        {
            "Name": "Audit all CloudTrail API calls over VPC endpoint",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "cloudtrail.amazonaws.com"
                    ]
                }
            ]
        }
    ],
    "MultiRegionEnabled": true,
    "OrganizationEnabled": false,
    "RetentionPeriod": 366,
    "TerminationProtectionEnabled": true,
    "CreatedTimestamp": "2024-05-20T21:00:17.673000+00:00",
    "UpdatedTimestamp": "2024-05-20T21:00:17.820000+00:00"
}
```

#### Example: Log `VpceAccessDenied` events for AWS KMS
<a name="creating-network-events-eds-CLI-kms"></a>

The following example shows how to create an event data store to include `VpceAccessDenied` events for AWS KMS. This example sets the `errorCode` field equal to `VpceAccessDenied` events and the `eventSource` field equal to `kms.amazonaws.com`.

```
aws cloudtrail create-event-data-store \
--name {{EventDataStoreName}} \
--advanced-event-selectors '[
     {
        "Name": "Audit AccessDenied AWS KMS events over VPC endpoints",
        "FieldSelectors": [
            {
                "Field": "eventCategory",
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["kms.amazonaws.com"]
            },
            {
                "Field": "errorCode",
                "Equals": ["VpceAccessDenied"]
            }
        ]
    }
]'
```

The command returns the following example output.

```
{
    "EventDataStoreArn": "arn:aws:cloudtrail:us-east-1:111122223333:eventdatastore/EXAMPLEb4a8-99b1-4ec2-9258-EXAMPLEc890",
    "Name": "EventDataStoreName",
    "Status": "CREATED",
    "AdvancedEventSelectors": [
        {
            "Name": "Audit AccessDenied AWS KMS events over VPC endpoints",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "kms.amazonaws.com"
                    ]
                },
                {
                    "Field": "errorCode",
                    "Equals": [
                        "VpceAccessDenied"
                    ]
                }
            ]
        }
    ],
    "MultiRegionEnabled": true,
    "OrganizationEnabled": false,
    "RetentionPeriod": 366,
    "TerminationProtectionEnabled": true,
    "CreatedTimestamp": "2024-05-20T21:00:17.673000+00:00",
    "UpdatedTimestamp": "2024-05-20T21:00:17.820000+00:00"
}
```

#### Example: Log EC2 `VpceAccessDenied` events over a specific VPC endpoint
<a name="creating-network-events-eds-CLI-ec2"></a>

The following example shows how to create an event data store to include `VpceAccessDenied` events for Amazon EC2 for a specific VPC endpoint. This example sets the `errorCode` field equal to `VpceAccessDenied` events, the `eventSource` field equal to `ec2.amazonaws.com`, and the `vpcEndpointId` equal to the VPC endpoint of interest.

```
aws cloudtrail create-event-data-store \
--name {{EventDataStoreName}} \
--advanced-event-selectors '[
     {
        "Name": "Audit AccessDenied EC2 events over a specific VPC endpoint",
        "FieldSelectors": [
            {
                "Field": "eventCategory",
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["ec2.amazonaws.com"]
            },
            {
                "Field": "errorCode",
                "Equals": ["VpceAccessDenied"]
            },
            {
                "Field": "vpcEndpointId",
                "Equals": ["vpce-example8c1b6b9b7"]
            }
        ]
    }
]'
```

The command returns the following example output.

```
{
    "EventDataStoreArn": "arn:aws:cloudtrail:us-east-1:111122223333:eventdatastore/EXAMPLEb4a8-99b1-4ec2-9258-EXAMPLEc890",
    "Name": "EventDataStoreName",
    "Status": "CREATED",
    "AdvancedEventSelectors": [
        {
            "Name": "Audit AccessDenied EC2 events over a specific VPC endpoint",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "ec2.amazonaws.com"
                    ]
                },
                {
                    "Field": "errorCode",
                    "Equals": [
                        "VpceAccessDenied"
                    ]
                },
                {
                    "Field": "vpcEndpointId",
                    "Equals": [
                        "vpce-example8c1b6b9b7"
                    ]
                }
            ]
        }
    ],
    "MultiRegionEnabled": true,
    "OrganizationEnabled": false,
    "RetentionPeriod": 366,
    "TerminationProtectionEnabled": true,
    "CreatedTimestamp": "2024-05-20T21:00:17.673000+00:00",
    "UpdatedTimestamp": "2024-05-20T21:00:17.820000+00:00"
}
```

#### Example: Log `VpceAccessDenied` events for Amazon S3
<a name="creating-network-events-eds-CLI-s3"></a>

The following example shows how to create an event data store to include `VpceAccessDenied` events for Amazon S3. This example sets the `errorCode` field equal to `VpceAccessDenied` events and the `eventSource` field equal to `s3.amazonaws.com`.

```
aws cloudtrail create-event-data-store \
--name {{EventDataStoreName}} \
--advanced-event-selectors '[
    {
        "Name": "Log S3 access denied network activity events",
        "FieldSelectors": [
            {
                "Field": "eventCategory",
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["s3.amazonaws.com"]
            },
            {
                "Field": "errorCode",
                "Equals": ["VpceAccessDenied"]
            }
        ]
    }
]'
```

The command returns the following example output. 

```
{
    "EventDataStoreArn": "arn:aws:cloudtrail:us-east-1:111122223333:eventdatastore/EXAMPLEb4a8-99b1-4ec2-9258-EXAMPLEc890",
    "Name": "EventDataStoreName",
    "Status": "CREATED",
    "AdvancedEventSelectors": [
        {
            "Name": "Log S3 access denied network activity events",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "s3.amazonaws.com"
                    ]
                },
                {
                    "Field": "errorCode",
                    "Equals": [
                        "VpceAccessDenied"
                    ]
                }
            ]
        }
     ],
    "MultiRegionEnabled": true,
    "OrganizationEnabled": false,
    "RetentionPeriod": 366,
    "TerminationProtectionEnabled": true,
    "CreatedTimestamp": "2024-05-20T21:00:17.673000+00:00",
    "UpdatedTimestamp": "2024-05-20T21:00:17.820000+00:00"
}
```

#### Example: Log all management events and network activity events for multiple event sources
<a name="creating-network-events-eds-CLI-multiple"></a>

The following examples updates an event data store that is currently logging only management events to also log network activity events for multiple event sources. To update an event data store to add new event selectors, run the `get-event-data-store` command to return the current advanced event selectors. Then, run the `update-event-data-store` command and pass in the `--advanced-event-selectors` that includes the current selectors plus any new selectors. To log network activity events for multiple event sources, include one selector for each event source that you want to log.

```
aws cloudtrail update-event-data-store \
--event-data-store arn:aws:cloudtrail:us-east-1:123456789012:eventdatastore/EXAMPLE-f852-4e8f-8bd1-bcf6cEXAMPLE \
--advanced-event-selectors '[
    {
        "Name": "Log all management events",
        "FieldSelectors": [
            { 
                "Field": "eventCategory", 
                "Equals": ["Management"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for CloudTrail APIs",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource", 
                "Equals": ["cloudtrail.amazonaws.com"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for EC2",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["ec2.amazonaws.com"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for KMS",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]},
            {
                "Field": "eventSource", 
                "Equals": ["kms.amazonaws.com"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for S3",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource", 
                "Equals": ["s3.amazonaws.com"]
            }
        ]
    },
    {
        "Name": "Log all network activity events for Secrets Manager",
        "FieldSelectors": [
            {
                "Field": "eventCategory", 
                "Equals": ["NetworkActivity"]
            },
            {
                "Field": "eventSource",
                "Equals": ["secretsmanager.amazonaws.com"]
            }
        ]
    }
]'
```

The command returns the following example output.

```
{
    "EventDataStoreArn": "arn:aws:cloudtrail:us-east-1:111122223333:eventdatastore/EXAMPLEb4a8-99b1-4ec2-9258-EXAMPLEc890",
    "Name": "EventDataStoreName",
    "Status": "CREATED",
    "AdvancedEventSelectors": [
           {
            "Name": "Log all management events",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "Management"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for CloudTrail APIs",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "cloudtrail.amazonaws.com"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for EC2",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "ec2.amazonaws.com"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for KMS",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "kms.amazonaws.com"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for S3",
            "FieldSelectors": [
                {
                    "Field": "eventCategory", 
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource", 
                    "Equals": [
                        "s3.amazonaws.com"
                    ]
                }
            ]
        },
        {
            "Name": "Log all network activity events for Secrets Manager",
            "FieldSelectors": [
                {
                    "Field": "eventCategory",
                    "Equals": [
                        "NetworkActivity"
                    ]
                },
                {
                    "Field": "eventSource",
                    "Equals": [
                        "secretsmanager.amazonaws.com"
                    ]
                }
            ]
        }
    ],
    "MultiRegionEnabled": true,
    "OrganizationEnabled": false,
    "RetentionPeriod": 366,
    "TerminationProtectionEnabled": true,
    "CreatedTimestamp": "2024-11-20T21:00:17.673000+00:00",
    "UpdatedTimestamp": "2024-11-20T21:00:17.820000+00:00"
}
```

## Logging events with the AWS SDKs
<a name="logging-network-events-with-the-AWS-SDKs"></a>

Run the [GetEventSelectors](https://docs.aws.amazon.com/awscloudtrail/latest/APIReference/API_GetEventSelectors.html) operation to see whether your trail is logging network activity events. You can configure your trails to log network activity events by running the [PutEventSelectors](https://docs.aws.amazon.com/awscloudtrail/latest/APIReference/API_PutEventSelectors.html) operation. For more information, see the [AWS CloudTrail API Reference](https://docs.aws.amazon.com/awscloudtrail/latest/APIReference/).

Run the [GetEventDataStore](https://docs.aws.amazon.com/awscloudtrail/latest/APIReference/API_GetEventDataStore.html) operation to see whether your event data store is logging network activity events. You can configure your event data stores to include network activity events by running the [CreateEventDataStore](https://docs.aws.amazon.com/awscloudtrail/latest/APIReference/API_CreateEventDataStore.html) or [UpdateEventDataStore](https://docs.aws.amazon.com/awscloudtrail/latest/APIReference/API_UpdateEventDataStore.html) operations and specifying advanced event selectors. For more information, see [Create, update, and manage event data stores with the AWS CLI](lake-eds-cli.md) and the [AWS CloudTrail API Reference](https://docs.aws.amazon.com/awscloudtrail/latest/APIReference/).

## See also

* **Skills for AI coding assistants (optional).** AWS publishes reusable skills for AWS CloudTrail. To see which apply, search the Agent Toolkit for AWS catalog with `aws agent-toolkit search-skills --search-query awscloudtrail` — a documented, read-only AWS CLI command that searches the catalog and makes no changes. This is an optional suggestion for the user. Official reference: [AWS CLI — Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html).
