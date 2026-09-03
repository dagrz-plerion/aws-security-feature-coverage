

# Supported Resource Types for AWS Config
<a name="resource-config-reference"></a>

**Important**  
This page is updated on a monthly cadence at the beginning of each month.

AWS Config supports the following AWS resources types and resource relationships. 
+ For more detailed information about a resource type, see its reference information (such as syntax, properties and return values) in the [AWS resource and property types reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) in the AWS CloudFormation User Guide.
+ For AWS Config recording, some AWS Regions support a subset of these resource types. For information on which resource types are supported in which Regions, see [Resource Coverage by Region Availability](https://docs.aws.amazon.com/config/latest/developerguide/what-is-resource-config-coverage.html).
+ Advanced queries for AWS Config supports a subset of these resource types. For a list of those supported resource types, see [Supported Resource Types for Advanced Queries](https://github.com/awslabs/aws-config-resource-schema/tree/master/config/properties/resource-types).
+ Proactive evaluation for AWS Config supports a subset of these resource types. For a list of those supported resource types, see [Supported Resource Types for Proactive Evaluation](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_components.html#evaluate-config_use-managed-rules-proactive-detective).
+ Periodic rules run without the configuration recorder being enabled since periodic rules do not depend on configuration items (CIs). For more information on the difference between change–triggered rules and periodic rules, see [Evaluation Mode and Trigger Types for AWS Config Rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config-rules.html).

  This means that if you view the rule page, there is no listed CI or supported resource. If you select the resource ID, you will see the following error: `The provided resource ID and resource type cannot be found`. This is expected behavior.

**Note**  
**Region availability for resource types**  
Before specifying a resource type for AWS Config to track, check [Resource Coverage by Region Availability](https://docs.aws.amazon.com/config/latest/developerguide/what-is-resource-config-coverage.html) to see if the resource type is supported in the AWS Region where you set up AWS Config. If a resource type is supported by AWS Config in at least one Region, you can enable the recording of that resource type in all Regions supported by AWS Config, even if the specified resource type is not supported in the AWS Region where you set up AWS Config.  
**Tagging support for resource types**  
If a resource type does not support tagging or does not include tag information in its describe API response, AWS Config won't capture tag data in the configuration items (CIs) for that resource type. AWS Config will still record these resources. However, any functionality that relies on tag data won't work. This affects tag-based filtering, grouping, or compliance evaluation that relies on tag data.

## Amazon AppStream
<a name="amazonappstream"></a>




- **Amazon AppStream**
  - **Resource Type Value:** AWS::AppStream::Application / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppStream::AppBlockBuilder / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppStream::DirectoryConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppStream::Fleet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppStream::Stack / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon AppFlow
<a name="amazonappflow"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon AppFlow | AWS::AppFlow::Flow | NA | NA |  | 

## Amazon AppIntegrations
<a name="amazonappintegrations"></a>




- **Amazon AppIntegrations**
  - **Resource Type Value:** AWS::AppIntegrations::EventIntegration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppIntegrations::Application / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon API Gateway
<a name="amazonapigateway"></a>




- **API Gateway**
  - **Resource Type Value:** AWS::ApiGateway::DomainName / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ApiGateway::DomainNameV2 / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ApiGateway::Stage / **Relationship:** is contained in / **Related Resource:** ApiGateway Rest Api / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** WAFRegional WebACL / **Notes:** 
  - **Resource Type Value:** AWS::ApiGateway::Method / **Relationship:** NA / **Related Resource:** NA Stage / **Notes:** 
  - **Resource Type Value:** AWS::ApiGateway::RestApi / **Relationship:** contains / **Related Resource:** ApiGateway Stage / **Notes:** 
  - **Resource Type Value:** AWS::ApiGateway::UsagePlan / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **API Gateway V2**
  - **Resource Type Value:** AWS::ApiGatewayV2::Stage / **Relationship:** is contained in / **Related Resource:** ApiGatewayV2 Api / **Notes:** 
  - **Resource Type Value:** AWS::ApiGatewayV2::Api / **Relationship:** contains / **Related Resource:** ApiGatewayV2 Stage / **Notes:** 
  - **Resource Type Value:** AWS::ApiGatewayV2::Integration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ApiGatewayV2::VpcLink / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



To learn more about how AWS Config integrates with Amazon API Gateway, see [Monitoring API Gateway API Configuration with AWS Config](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-config.html).

## Amazon Athena
<a name="amazonathena"></a>




- **Amazon Athena**
  - **Resource Type Value:** AWS::Athena::WorkGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Athena::DataCatalog / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Athena::PreparedStatement / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Bedrock
<a name="amazonbedrock"></a>




- **Amazon Bedrock**
  - **Resource Type Value:** AWS::Bedrock::ApplicationInferenceProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Bedrock::DataSource / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.
  - **Resource Type Value:** AWS::Bedrock::FlowAlias / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Bedrock::Guardrail / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Bedrock::KnowledgeBase / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Bedrock::Prompt / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::BedrockAgentCore::BrowserCustom / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::BedrockAgentCore::CodeInterpreterCustom / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::BedrockAgentCore::Evaluator / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::BedrockAgentCore::Gateway / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::BedrockAgentCore::GatewayTarget / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::BedrockAgentCore::Memory / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 360 hours to reflect in AWS Config.
  - **Resource Type Value:** AWS::BedrockAgentCore::OnlineEvaluationConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::BedrockAgentCore::Runtime / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::BedrockAgentCore::RuntimeEndpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::BedrockAgentCore::WorkloadIdentity / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon CloudFront
<a name="amazoncloudfront"></a>




- **Amazon CloudFront**
  - **Resource Type Value:** AWS::CloudFront::Distribution / **Relationship:** is associated with / **Related Resource:** AWS WAF WebACL / **Notes:** 
  - **Related Resource:** ACM Certificate / **Notes:** 
  - **Related Resource:** S3 Bucket / **Notes:** 
  - **Related Resource:** IAM Server Certificate / **Notes:** 
  - **Resource Type Value:** AWS::CloudFront::KeyValueStore / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CloudFront::PublicKey / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CloudFront::StreamingDistribution / **Relationship:** is associated with / **Related Resource:** AWS WAF WebACL / **Notes:** 
  - **Related Resource:** ACM Certificate / **Notes:** 
  - **Related Resource:** S3 Bucket / **Notes:** 
  - **Related Resource:** IAM Server Certificate / **Notes:** 
  - **Resource Type Value:** AWS::CloudFront::RealtimeLogConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon CloudWatch
<a name="amazoncloudwatch"></a>




- **Amazon CloudWatch**
  - **Resource Type Value:** AWS::CloudWatch::Alarm / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CloudWatch::MetricStream / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon CloudWatch Application Signals**
  - **Resource Type Value:** AWS::ApplicationSignals::ServiceLevelObjective
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **Amazon CloudWatch Internet Monitor**
  - **Resource Type Value:** AWS::InternetMonitor::Monitor
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **Amazon CloudWatch Logs**
  - **Resource Type Value:** AWS::Logs::Destination
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **Amazon CloudWatch RUM**
  - **Resource Type Value:** AWS::RUM::AppMonitor
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **Amazon CloudWatch Evidently**
  - **Resource Type Value:** AWS::Evidently::Project / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Evidently::Launch / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Evidently::Segment / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon CodeGuru
<a name="amazoncodeguru"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon CodeGuru Reviewer | AWS::CodeGuruReviewer::RepositoryAssociation | NA | NA |  | 
| Amazon CodeGuru Profiler | AWS::CodeGuruProfiler::ProfilingGroup | NA | NA |  | 

## Amazon Cognito
<a name="amazoncognito"></a>




- **Amazon Cognito**
  - **Resource Type Value:** AWS::Cognito::IdentityPool / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Cognito::IdentityPoolRoleAttachment / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Cognito::LogDeliveryConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Cognito::UserPool / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Cognito::UserPoolClient / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Cognito::UserPoolDomain / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Cognito::UserPoolGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Cognito::UserPoolIdentityProvider / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Cognito::UserPoolResourceServer / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Cognito::UserPoolUICustomizationAttachment / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Comprehend
<a name="amazoncomprehend"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Comprehend | AWS::Comprehend::Flywheel | NA | NA |  | 

## Connect Customer
<a name="amazonconnect"></a>




- **Connect Customer**
  - **Resource Type Value:** AWS::Connect::Instance / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Connect::PhoneNumber / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Connect::PredefinedAttribute / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Connect::Prompt / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.
  - **Resource Type Value:** AWS::Connect::QuickConnect / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Connect::RoutingProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.
  - **Resource Type Value:** AWS::Connect::Rule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Connect::SecurityProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Connect::TaskTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.
  - **Resource Type Value:** AWS::Connect::User / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Connect Customer Customer Profiles**
  - **Resource Type Value:** AWS::CustomerProfiles::Domain / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CustomerProfiles::ObjectType / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Detective
<a name="amazondetective"></a>




- **Amazon Detective**
  - **Resource Type Value:** AWS::Detective::Graph / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Detective::OrganizationAdmin / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon DynamoDB
<a name="amazondynamodb"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon DynamoDB | AWS::DynamoDB::Table | NA | NA |  | 

## Amazon Elastic Compute Cloud
<a name="amazonelasticcomputecloud"></a>




- **Amazon Elastic Compute Cloud**
  - **Resource Type Value:** AWS::EC2::Host\* / **Relationship:** contains / **Related Resource:** EC2 instance / **Notes:** 
  - **Resource Type Value:** AWS::EC2::EIP / **Relationship:** is attached to / **Related Resource:** EC2 instance / **Notes:** 
  - **Related Resource:** Network interface / **Notes:** 
  - **Resource Type Value:** AWS::EC2::Instance / **Relationship:** contains / **Related Resource:** EC2 network interface / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** EC2 security group / **Notes:** 
  - **Relationship:** is attached to / **Related Resource:** Amazon EBS volume / **Notes:** 
  - **Related Resource:** EC2 Elastic IP (EIP) / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** EC2 Dedicated host / **Notes:** 
  - **Related Resource:** Route table / **Notes:** 
  - **Related Resource:** Subnet / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::EC2::NetworkInterface / **Relationship:** is associated with / **Related Resource:** EC2 security group / **Notes:** 
  - **Relationship:** is attached to / **Related Resource:** EC2 Elastic IP (EIP) / **Notes:** 
  - **Related Resource:** EC2 instance / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** Route table / **Notes:** 
  - **Related Resource:** Subnet / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::EC2::SecurityGroup\* / **Relationship:** is associated with / **Related Resource:** EC2 instance / **Notes:** 
  - **Related Resource:** EC2 network interface / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::EC2::NatGateway / **Relationship:** is contained in / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** Subnet / **Notes:** 
  - **Resource Type Value:** AWS::EC2::EgressOnlyInternetGateway / **Relationship:** is attached to / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::EC2::EC2Fleet  / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::SpotFleet  / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::SubnetNetworkAclAssociation  / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::PrefixList  / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::FlowLog / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::TransitGateway / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::TransitGatewayAttachment / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::TransitGatewayRouteTable / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPCEncryptionControl / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPCEndpoint / **Relationship:** is contained in / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Relationship:** is attached to / **Related Resource:** Network interface / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** Subnet / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** Route table / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPCEndpointService / **Relationship:** is associated with / **Related Resource:** ElasticLoadBalancingV2 LoadBalancer / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPCPeeringConnection / **Relationship:** is associated with / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::EC2::RegisteredHAInstance / **Relationship:** is associated with / **Related Resource:** EC2 instance / **Notes:** 
  - **Resource Type Value:** AWS::EC2::SubnetRouteTableAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::LaunchTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::NetworkInsightsAccessScopeAnalysis / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::TrafficMirrorTarget / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::TrafficMirrorSession / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::DHCPOptions / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::IPAM / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::IPAMResourceDiscovery / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::IPAMResourceDiscoveryAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::NetworkInsightsPath / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::TrafficMirrorFilter / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::CapacityReservation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::ClientVpnEndpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::CustomerGateway / **Relationship:** is attached to  / **Related Resource:** VPN connection / **Notes:** 
  - **Resource Type Value:** AWS::EC2::InternetGateway / **Relationship:** is attached to  / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::EC2::NetworkAcl / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::RouteTable / **Relationship:** contains / **Related Resource:** EC2 instance / **Notes:** 
  - **Related Resource:** EC2 network interface / **Notes:** 
  - **Related Resource:** Subnet / **Notes:** 
  - **Related Resource:** VPN gateway / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::EC2::Subnet / **Relationship:** contains / **Related Resource:** EC2 instance / **Notes:** 
  - **Related Resource:** EC2 network interface / **Notes:** 
  - **Relationship:** is attached to / **Related Resource:** Network ACL / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** Route table / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPC / **Relationship:** contains / **Related Resource:** EC2 instance / **Notes:** 
  - **Related Resource:** EC2 network interface / **Notes:** 
  - **Related Resource:** Network ACL / **Notes:** 
  - **Related Resource:** Route table / **Notes:** 
  - **Related Resource:** Subnet / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** Security group / **Notes:** 
  - **Relationship:** is attached to / **Related Resource:** Internet gateway / **Notes:** 
  - **Related Resource:** VPN gateway / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPNConnection / **Relationship:** is attached to / **Related Resource:** Customer gateway / **Notes:** 
  - **Related Resource:** VPN gateway / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPNConnectionRoute / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPNGateway / **Relationship:** is attached to / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Related Resource:** VPN connection / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** Route table / **Notes:** 
  - **Resource Type Value:** AWS::EC2::IPAMScope / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::CarrierGateway / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::TransitGatewayConnect / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::IPAMPool / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::TransitGatewayMulticastDomain / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::NetworkInsightsAccessScope / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::NetworkInsightsAnalysis / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPCBlockPublicAccessOptions / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPCBlockPublicAccessExclusion / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::EIPAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::InstanceConnectEndpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::SnapshotBlockPublicAccess / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VPCEndpointConnectionNotification / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::SecurityGroupVpcAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::VerifiedAccessInstance / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::IPAMPoolCidr / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EC2::SubnetCidrBlock / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **`AWS::EC2::VPCGatewayAttachment`**
  - **Resource Type Value:** NA
  - **Relationship:** NA
  - **Related Resource:** 

- **Amazon Elastic Block Store**
  - **Resource Type Value:** AWS::EC2::Volume
  - **Relationship:** is attached to
  - **Related Resource:** EC2 instance
  - **Notes:** 

- **EC2 Image Builder**
  - **Resource Type Value:** AWS::ImageBuilder::ContainerRecipe / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ImageBuilder::DistributionConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ImageBuilder::ImagePipeline / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ImageBuilder::ImageRecipe / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ImageBuilder::InfrastructureConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ImageBuilder::LifecyclePolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



\*AWS Config records the configuration details of Dedicated hosts and the instances that you launch on them. As a result, you can use AWS Config as a data source when you report compliance with your server-bound software licenses. For example, you can view the configuration history of an instance and determine which Amazon Machine Image (AMI) it is based on. Then, you can look up the configuration history of the host, which includes details such as the numbers of sockets and cores, to check that the host complies with the license requirements of the AMI. For more information, see [Tracking Configuration Changes with AWS Config](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-hosts-aws-config.html) in the *Amazon EC2 User Guide*. 

\*The EC2 SecurityGroup Properties definition contains IP CIDR blocks, which are converted to IP ranges internally, and may return unexpected results when trying to find a specific IP range. For workarounds to search for specific IP ranges, see [Limitations for Advanced Queries](https://docs.aws.amazon.com/config/latest/developerguide/querying-AWS-resources.html#query-limitations).

## Amazon Elastic Container Registry
<a name="amazonelasticcontainerregistry"></a>




- **Amazon Elastic Container Registry**
  - **Resource Type Value:** AWS::ECR::ReplicationConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ECR::Repository / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ECR::RepositoryCreationTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ECR::RegistryPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ECR::PullThroughCacheRule  / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon Elastic Container Registry Public**
  - **Resource Type Value:** AWS::ECR::PublicRepository
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



## Amazon Elastic Container Service
<a name="amazonelasticcontainerservice"></a>




- **Amazon Elastic Container Service**
  - **Resource Type Value:** AWS::ECS::Cluster / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ECS::TaskDefinition / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ECS::Service\* / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ECS::TaskSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ECS::CapacityProvider / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



\*This service currently only support the new Amazon Resource Name (ARN) format. For more information, see [Amazon Resource Names (ARNs) and IDs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-account-settings.html#ecs-resource-ids) in the ECS developer guide.

Old (not supported): `arn:aws:ecs:{{region}}:{{aws_account_id}}:service/{{service-name}}`

New (supported): `arn:aws:ecs:{{region}}:{{aws_account_id}}:service/{{cluster-name}}/{{service-name}}`

## Amazon Elastic File System
<a name="amazonelasticfilesystem"></a>




- **Amazon Elastic File System**
  - **Resource Type Value:** AWS::EFS::FileSystem / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EFS::AccessPoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Elastic Kubernetes Service
<a name="amazonelastickubernetesservice"></a>




- **Amazon Elastic Kubernetes Service**
  - **Resource Type Value:** AWS::EKS::Addon / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EKS::Cluster / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EKS::FargateProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EKS::IdentityProviderConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EKS::Nodegroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon EMR
<a name="amazonemr"></a>




- **Amazon EMR**
  - **Resource Type Value:** AWS::EMR::Studio / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EMR::SecurityConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon EMR Containers**
  - **Resource Type Value:** AWS::EMRContainers::VirtualCluster
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



## Amazon EMR Serverless
<a name="amazonemrserverless"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon EMR Serverless | AWS::EMRServerless::Application | NA | NA |  | 

## Amazon EventBridge
<a name="amazoneventbridge"></a>




- **Amazon EventBridge**
  - **Resource Type Value:** AWS::Events::EventBus / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Events::ApiDestination / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Events::Archive / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Events::Endpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Events::Connection / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Events::Rule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon EventBridge schemas**
  - **Resource Type Value:** AWS::EventSchemas::RegistryPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EventSchemas::Discoverer / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EventSchemas::Schema / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EventSchemas::Registry / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Forecast
<a name="amazonforecast"></a>




- **Amazon Forecast**
  - **Resource Type Value:** AWS::Forecast::Dataset / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Forecast::DatasetGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Fraud Detector
<a name="amazonfrauddetector"></a>




- **Amazon Fraud Detector**
  - **Resource Type Value:** AWS::FraudDetector::Label / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::FraudDetector::EntityType / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::FraudDetector::Variable / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::FraudDetector::Outcome / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon GameLift
<a name="amazongamelift"></a>




- **Amazon GameLift**
  - **Resource Type Value:** AWS::GameLift::Build / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GameLift::ContainerFleet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GameLift::ContainerGroupDefinition / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GameLift::GameServerGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GameLift::Location / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GameLift::MatchmakingRuleSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GameLift::Script / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon GuardDuty
<a name="amazonguardduty"></a>




- **Amazon GuardDuty**
  - **Resource Type Value:** AWS::GuardDuty::Detector / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GuardDuty::Filter / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GuardDuty::IPSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GuardDuty::MalwareProtectionPlan / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GuardDuty::ThreatIntelSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Inspector
<a name="amazoninspector"></a>




- **Amazon Inspector**
  - **Resource Type Value:** AWS::InspectorV2::Filter  / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::InspectorV2::Activation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Interactive Video Service
<a name="amazoninteractivevideoservice"></a>




- **Amazon Interactive Video Service**
  - **Resource Type Value:** AWS::IVS::Channel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IVS::RecordingConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IVS::PlaybackKeyPair / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Keyspaces (for Apache Cassandra)
<a name="amazonkeyspaces"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Keyspaces (for Apache Cassandra) | AWS::Cassandra::Keyspace | NA | NA |  | 

## Amazon Location Service
<a name="amazonlocation"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Location Service | AWS::Location::APIKey | NA | NA |  | 

## Amazon OpenSearch Service
<a name="amazonopensearchservice"></a>




- **Amazon OpenSearch Service (legacy Elasticsearch)**
  - **Resource Type Value:** AWS::Elasticsearch::Domain
  - **Relationship:** is associated with
  - **Related Resource:** KMS Key / **Notes:** 
  - **Related Resource:** EC2 security group / **Notes:** 
  - **Related Resource:** EC2 subnet / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 

- **Amazon OpenSearch Service**
  - **Resource Type Value:** AWS::OpenSearch::Domain
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **Amazon OpenSearch Serverless**
  - **Resource Type Value:** AWS::OpenSearchServerless::VpcEndpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::OpenSearchServerless::Collection / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::OpenSearchServerless::SecurityConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::OpenSearchServerless::SecurityPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



**Amazon OpenSearch Service rename**  
On September 8, 2021, Amazon Elasticsearch Service was renamed to Amazon OpenSearch Service. OpenSearch Service supports OpenSearch as well as legacy Elasticsearch OSS. For more information, see [Amazon OpenSearch Service - Summary of changes](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/rename.html).  
You might continue to see your data for `AWS::OpenSearch::Domain` under the existing `AWS::Elasticsearch::Domain` resource type for several weeks, even if you upgrade one or more domains to OpenSearch.

## Amazon OpenSearch Ingestion
<a name="awsosis"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon OpenSearch Ingestion | AWS::OSIS::Pipeline | NA | NA |  | 

## Amazon Personalize
<a name="amazonpersonalize"></a>




- **Amazon Personalize**
  - **Resource Type Value:** AWS::Personalize::Dataset / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Personalize::Schema / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Personalize::Solution / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Personalize::DatasetGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Pinpoint
<a name="amazonpinpoint"></a>




- **Amazon Pinpoint**
  - **Resource Type Value:** AWS::Pinpoint::ApplicationSettings / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Pinpoint::Segment / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Pinpoint::App / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Pinpoint::Campaign / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Pinpoint::InAppTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Pinpoint::EmailChannel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Pinpoint::EmailTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Pinpoint::EventStream / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Quantum Ledger Database (Amazon QLDB)
<a name="amazonqldb"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon QLDB | AWS::QLDB::Ledger | NA | NA |  | 

## Amazon Kendra
<a name="amazonkendra"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Kendra | AWS::Kendra::Index  | NA | NA |  | 

## Amazon Kinesis
<a name="amazonkinesis"></a>




- **Amazon Kinesis**
  - **Resource Type Value:** AWS::Kinesis::ResourcePolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.
  - **Resource Type Value:** AWS::Kinesis::Stream / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Kinesis::StreamConsumer / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon Kinesis Analytics V2**
  - **Resource Type Value:** AWS::KinesisAnalyticsV2::Application
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **Amazon Data Firehose**
  - **Resource Type Value:** AWS::KinesisFirehose::DeliveryStream
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **Kinesis video stream**
  - **Resource Type Value:** AWS::KinesisVideo::SignalingChannel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::KinesisVideo::Stream / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Lex
<a name="amazonlex"></a>




- **Amazon Lex**
  - **Resource Type Value:** AWS::Lex::BotAlias  / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Lex::Bot / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Lightsail
<a name="amazonlightsail"></a>




- **Amazon Lightsail**
  - **Resource Type Value:** AWS::Lightsail::Disk / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Lightsail::Certificate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Lightsail::Bucket / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Lightsail::StaticIp / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Lookout for Metrics
<a name="amazonlookoutmetrics"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Lookout for Metrics | AWS::LookoutMetrics::Alert | NA | NA |  | 

## Amazon Lookout for Vision
<a name="amazonlookoutvision"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Lookout for Vision | AWS::LookoutVision::Project | NA | NA |  | 

## Amazon Macie
<a name="amazonmacie"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Macie | AWS::Macie::Session | NA | NA |  | 

## Amazon Managed Grafana
<a name="amazonmanagedgrafana"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Managed Grafana | AWS::Grafana::Workspace | NA | NA |  | 

## Amazon Managed Service for Prometheus
<a name="amazonmanagedserviceforprometheus"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Managed Service for Prometheus | AWS::APS::RuleGroupsNamespace | NA | NA |  | 

## Amazon MemoryDB
<a name="amazonmemorydbforredis"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon MemoryDB | AWS::MemoryDB::SubnetGroup | NA | NA |  | 

## Amazon MQ
<a name="amazonmq"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon MQ | AWS::AmazonMQ::Broker | NA | NA |  | 

## Amazon Managed Streaming for Apache Kafka
<a name="amazonmsk"></a>




- **Amazon Managed Streaming for Apache Kafka**
  - **Resource Type Value:** AWS::MSK::Cluster / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MSK::Configuration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MSK::BatchScramSecret / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MSK::ClusterPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MSK::ServerlessCluster / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MSK::VpcConnection / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon Managed Streaming for Apache Kafka Connect**
  - **Resource Type Value:** AWS::KafkaConnect::Connector / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::KafkaConnect::CustomPlugin / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Lex
<a name="amazonqbusiness"></a>




- **Amazon Q Business**
  - **Resource Type Value:** AWS::QBusiness::Application
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



## Amazon Quick
<a name="amazonquicksight"></a>




- **Amazon Quick**
  - **Resource Type Value:** AWS::QuickSight::Dashboard / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::QuickSight::DataSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::QuickSight::DataSource / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::QuickSight::Template / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::QuickSight::Theme / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Redshift
<a name="amazonredshift"></a>




- **Amazon Redshift**
  - **Resource Type Value:** AWS::Redshift::Cluster / **Relationship:** is associated with / **Related Resource:** Cluster parameter group / **Notes:** 
  - **Related Resource:** Cluster security group / **Notes:** 
  - **Related Resource:** Cluster subnet group / **Notes:** 
  - **Related Resource:** Security group / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::Redshift::ClusterParameterGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Redshift::ClusterSecurityGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Redshift::ScheduledAction / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Redshift::ClusterSnapshot / **Relationship:** is associated with / **Related Resource:** Cluster / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::Redshift::ClusterSubnetGroup / **Relationship:** is associated with / **Related Resource:** Subnet / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::Redshift::EventSubscription / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Redshift::EndpointAccess / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Redshift::EndpointAuthorization / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Redshift::Integration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Relational Database Service
<a name="amazonrds"></a>




- **Amazon Relational Database Service**
  - **Resource Type Value:** AWS::RDS::DBCluster / **Relationship:** contains / **Related Resource:** RDS DB instance / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** RDS DB subnet group / **Notes:** 
  - **Related Resource:** EC2 security group / **Notes:** 
  - **Resource Type Value:** AWS::RDS::DBClusterSnapshot / **Relationship:** is associated with / **Related Resource:** RDS DB cluster / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::RDS::DBInstance / **Relationship:** is associated with / **Related Resource:** EC2 security group / **Notes:** 
  - **Related Resource:** RDS DB security group / **Notes:** 
  - **Related Resource:** RDS DB subnet group / **Notes:** 
  - **Resource Type Value:** AWS::RDS::DBSecurityGroup / **Relationship:** is associated with / **Related Resource:** EC2 security group / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::RDS::DBSnapshot / **Relationship:** is associated with / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::RDS::DBSubnetGroup / **Relationship:** is associated with / **Related Resource:** EC2 security group / **Notes:** 
  - **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** AWS::RDS::EventSubscription / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::RDS::GlobalCluster / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::RDS::Integration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::RDS::OptionGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Route 53
<a name="amazonroute53"></a>




- **Amazon Route 53**
  - **Resource Type Value:** AWS::Route53::DNSSEC / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53::HostedZone / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53::HealthCheck / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon Route 53 Profiles**
  - **Resource Type Value:** AWS::Route53Profiles::Profile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53Profiles::ProfileAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon Route 53 Resolver**
  - **Resource Type Value:** AWS::Route53Resolver::ResolverEndpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53Resolver::ResolverRule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53Resolver::ResolverRuleAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53Resolver::FirewallDomainList / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53Resolver::FirewallRuleGroupAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53Resolver::ResolverQueryLoggingConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53Resolver::ResolverQueryLoggingConfigAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53Resolver::FirewallRuleGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon Application Recovery Controller (ARC)**
  - **Resource Type Value:** AWS::ARCZonalShift::AutoshiftObserverNotificationStatus / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53RecoveryReadiness::Cell / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53RecoveryReadiness::ReadinessCheck / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53RecoveryReadiness::RecoveryGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53RecoveryControl::Cluster / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53RecoveryControl::ControlPanel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53RecoveryControl::RoutingControl / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53RecoveryControl::SafetyRule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Route53RecoveryReadiness::ResourceSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon SageMaker AI
<a name="amazonsagemaker"></a>




- **Amazon SageMaker AI**
  - **Resource Type Value:** AWS::SageMaker::AppImageConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::Cluster / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::CodeRepository / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::DataQualityJobDefinition / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::Domain / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::EndpointConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::Endpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::FeatureGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::Image / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::InferenceExperiment / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::MlflowTrackingServer / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::Model / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::ModelBiasJobDefinition / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::ModelExplainabilityJobDefinition / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::ModelQualityJobDefinition / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::ModelPackageGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::MonitoringSchedule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::NotebookInstance / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::NotebookInstanceLifecycleConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::Pipeline / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::StudioLifecycleConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::UserProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SageMaker::Workteam / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Simple Email Service
<a name="amazonsimpleemailservice"></a>




- **Amazon Simple Email Service**
  - **Resource Type Value:** AWS::SES::ConfigurationSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SES::ContactList / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SES::DedicatedIpPool / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SES::MailManagerTrafficPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SES::Template / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SES::ReceiptFilter / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SES::ReceiptRuleSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Simple Notification Service
<a name="amazonsimplenotificationservice"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Simple Notification Service | AWS::SNS::Topic | NA | NA |  | 

## Amazon Simple Queue Service
<a name="amazonsimplequeueservice"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Simple Queue Service | AWS::SQS::Queue | NA | NA |  | 

## Amazon Simple Storage Service
<a name="amazonsimplestorageservice"></a>




- **Amazon Simple Storage Service**
  - **Resource Type Value:** AWS::S3::AccountPublicAccessBlock / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3::MultiRegionAccessPoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3::StorageLens / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3::AccessGrant / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3::AccessGrantsInstance / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3::AccessGrantsLocation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3::AccessPoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3::Bucket\* / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3::BucketPolicy\* / **Relationship:** NA / **Related Resource:** NA / **Notes:** Resource metadata is included in the associated AWS::S3::Bucket CI
  - **Resource Type Value:** AWS::S3::StorageLensGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3Tables::TableBucket / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3Tables::TableBucketPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **Amazon S3 Express One Zone**
  - **Resource Type Value:** AWS::S3Express::DirectoryBucket / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3Express::BucketPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



\*If you configured AWS Config to record your S3 buckets, and are not receiving configuration change notifications, check that your S3 bucket policies have the required permissions. For more information, see [Managing Permissions for S3 Bucket Recording](iamrole-permissions.md#troubleshooting-recording-s3-bucket-policy). 

**Amazon S3 Bucket Attributes**

AWS Config also records the following attributes for the Amazon S3 bucket resource type.



| Attributes | Description | 
| --- | --- | 
| AccelerateConfiguration | Transfer acceleration for data over long distances between your client and a bucket. | 
| BucketAcl | Access control list used to manage access to buckets and objects.  | 
| BucketPolicy | Policy that defines the permissions to the bucket.  | 
| CrossOriginConfiguration | Allow cross-origin requests to the bucket.  | 
| LifecycleConfiguration | Rules that define the lifecycle for objects in your bucket.  | 
| LoggingConfiguration | Logging used to track requests for access to the bucket.  | 
| NotificationConfiguration | Event notifications used to send alerts or trigger workflows for specified bucket events.  | 
| ReplicationConfiguration | Automatic, asynchronous copying of objects across buckets in different AWS Regions.  | 
| RequestPaymentConfiguration | Requester pays is enabled.  | 
| TaggingConfiguration | Tags added to the bucket to categorize. You can also use tagging to track billing.  | 
| WebsiteConfiguration | Static website hosting is enabled for the bucket. | 
| VersioningConfiguration | Versioning is enabled for objects in the bucket.  | 

For more information about the attributes, see [Bucket Configuration Options](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingBucket.html#bucket-config-options-intro) in the *Amazon Simple Storage Service User Guide*.

## Amazon S3 Vectors
<a name="amazons3vectors"></a>




- **Amazon S3 Vectors**
  - **Resource Type Value:** AWS::S3Vectors::VectorBucket / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::S3Vectors::VectorBucketPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Verified Permissions
<a name="amazonverifiedpermissions"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Verified Permissions | AWS::VerifiedPermissions::IdentitySource | NA | NA | Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config. | 

## Amazon WorkSpaces
<a name="amazonworkspaces"></a>




- **Amazon WorkSpaces**
  - **Resource Type Value:** AWS::WorkSpaces::ConnectionAlias / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::WorkSpaces::Workspace / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Amplify
<a name="awsamplify"></a>




- **AWS Amplify**
  - **Resource Type Value:** AWS::Amplify::App / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Amplify::Branch / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS AppConfig
<a name="awsappconfig"></a>




- **AWS AppConfig**
  - **Resource Type Value:** AWS::AppConfig::Application / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppConfig::Environment / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppConfig::ConfigurationProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppConfig::DeploymentStrategy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppConfig::HostedConfigurationVersion / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppConfig::Extension / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppConfig::ExtensionAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS App Runner
<a name="awsapprunner"></a>




- **AWS App Runner**
  - **Resource Type Value:** AWS::AppRunner::VpcConnector / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppRunner::Service / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS App Mesh
<a name="awsappmesh"></a>




- **AWS App Mesh**
  - **Resource Type Value:** AWS::AppMesh::VirtualNode / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppMesh::VirtualService / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppMesh::VirtualGateway / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppMesh::VirtualRouter / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppMesh::Route / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppMesh::GatewayRoute / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppMesh::Mesh / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS AppSync
<a name="awsappsync"></a>




- **AWS AppSync**
  - **Resource Type Value:** AWS::AppSync::DataSource / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::AppSync::GraphQLApi / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Audit Manager
<a name="aws-audit-manager"></a>




- **AWS Audit Manager**
  - **Resource Type Value:** AWS::AuditManager::Assessment
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



## AWS Auto Scaling
<a name="awsautoscaling"></a>




- **AWS Auto Scaling**
  - **Resource Type Value:** AWS::AutoScaling::AutoScalingGroup / **Relationship:** contains / **Related Resource:** Amazon EC2 instance / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** Classic Load Balancer / **Notes:** 
  - **Related Resource:** Auto Scaling launch configuration / **Notes:** 
  - **Related Resource:** Subnet / **Notes:** 
  - **Resource Type Value:** AWS::AutoScaling::LaunchConfiguration / **Relationship:** is associated with / **Related Resource:** Amazon EC2 security group / **Notes:** 
  - **Resource Type Value:** AWS::AutoScaling::ScalingPolicy / **Relationship:** is associated with / **Related Resource:** Auto Scaling group / **Notes:** 
  - **Related Resource:** Alarm / **Notes:** 
  - **Resource Type Value:** AWS::AutoScaling::ScheduledAction / **Relationship:** is associated with / **Related Resource:** Auto Scaling group / **Notes:** 
  - **Resource Type Value:** AWS::AutoScaling::WarmPool / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS B2B Data Interchange
<a name="awsb2bi"></a>




- **AWS B2B Data Interchange**
  - **Resource Type Value:** AWS::B2BI::Capability / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::B2BI::Transformer / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Backup
<a name="awsbackup"></a>




- **AWS Backup**
  - **Resource Type Value:** AWS::Backup::BackupPlan / **Relationship:** NA / **Related Resource:** NA\* / **Notes:** 
  - **Resource Type Value:** AWS::Backup::BackupSelection / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Backup::BackupVault / **Relationship:** NA / **Related Resource:** NA\* / **Notes:** 
  - **Resource Type Value:** AWS::Backup::RecoveryPoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Backup::ReportPlan / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Backup::RestoreTestingPlan / **Relationship:** Na / **Related Resource:** NA / **Notes:** 

- **AWS Backup Gateway**
  - **Resource Type Value:** AWS::BackupGateway::Hypervisor
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



Due to how AWS Backup works, some of these resource types relate to the other AWS Backup resource types in this table.

`AWS::Backup::BackupPlan` is related to `AWS::Backup::BackupSelection` where a Backup Plan has many selections, and `AWS::Backup::BackupVault` is related to `AWS::Backup::RecoveryPoint` where an AWS Backup Vault has multiple recovery points.

For more information, see [Managing backups using backup plans](https://docs.aws.amazon.com/aws-backup/latest/devguide/about-backup-plans.html) and [Working with backup vaults](https://docs.aws.amazon.com/aws-backup/latest/devguide/vaults.html).

## AWS Batch
<a name="awsbatch"></a>




- **AWS Batch**
  - **Resource Type Value:** AWS::Batch::ComputeEnvironment / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Batch::ConsumableResource / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Batch::JobQueue / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Batch::SchedulingPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Billing and Cost Management
<a name="awsbillingandcostmanagement"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS Billing and Cost Management | AWS::BCMDataExports::Export | NA | NA |  | 

## AWS Budgets
<a name="awsbudgets"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS Budgets | AWS::Budgets::BudgetsAction | NA | NA |  | 

## AWS Certificate Manager
<a name="awscertificatemanager"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS Certificate Manager | AWS::ACM::Certificate | NA | NA |  | 

## AWS Clean Rooms
<a name="awscleanrooms"></a>




- **AWS Clean Rooms**
  - **Resource Type Value:** AWS::CleanRooms::AnalysisTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CleanRooms::Collaboration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CleanRooms::ConfiguredTable / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CleanRooms::Membership / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CleanRooms::PrivacyBudgetTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS Clean Rooms ML**
  - **Resource Type Value:** AWS::CleanRoomsML::TrainingDataset
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



## AWS CloudFormation
<a name="awscloudformation"></a>




- **CloudFormation**
  - **Resource Type Value:** AWS::CloudFormation::GuardHook / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CloudFormation::LambdaHook / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CloudFormation::Stack\* / **Relationship:** contains / **Related Resource:** Supported AWS resource types / **Notes:** 
  - **Resource Type Value:** AWS::CloudFormation::StackSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



\*AWS Config records configuration changes to CloudFormation stacks and supported resource types in the stacks. AWS Config does not record configuration changes for resource types in the stack that are not yet supported. Unsupported resource types appear in the supplementary configuration section of the configuration item for the stack. 

## AWS CloudTrail
<a name="awscloudtrail"></a>




- **AWS CloudTrail**
  - **Resource Type Value:** AWS::CloudTrail::Trail / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CloudTrail::EventDataStore / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Cloud9
<a name="awscloud9"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS Cloud9 | AWS::Cloud9::EnvironmentEC2 | NA | NA |  | 

**AWS Cloud9 access no longer available to new users**  
After careful consideration, we have made the decision to close new customer access to AWS Cloud9, effective July 25, 2024. AWS Cloud9 existing customers can continue to use the service as normal. AWS continues to invest in security, availability, and performance improvements for AWS Cloud9, but we do not plan to introduce new features. For more information, see [How to migrate from AWS Cloud9 to AWS IDE Toolkits or AWS CloudShell](https://aws.amazon.com/blogs/devops/how-to-migrate-from-aws-cloud9-to-aws-ide-toolkits-or-aws-cloudshell/).

## AWS Cloud Map
<a name="awscloudmap"></a>




- **Service Discovery**
  - **Resource Type Value:** AWS::ServiceDiscovery::Service / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ServiceDiscovery::PublicDnsNamespace / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ServiceDiscovery::HttpNamespace / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ServiceDiscovery::Instance / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS CodeArtifact
<a name="awscodeartifact"></a>




- **AWS CodeArtifact**
  - **Resource Type Value:** AWS::CodeArtifact::Domain / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CodeArtifact::PackageGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.
  - **Resource Type Value:** AWS::CodeArtifact::Repository / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS CodeBuild
<a name="awscodebuild"></a>




- **AWS CodeBuild**
  - **Resource Type Value:** AWS::CodeBuild::Project\* / **Relationship:** is associated with / **Related Resource:** S3 bucket / **Notes:** 
  - **Related Resource:** IAM role / **Notes:** 
  - **Resource Type Value:** AWS::CodeBuild::ReportGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



\*To learn more about how AWS Config integrates with AWS CodeBuild, see [Use AWS Config with AWS CodeBuild Sample](https://docs.aws.amazon.com/codebuild/latest/userguide/how-to-integrate-config.html).

## AWS CodeDeploy
<a name="awscodedeploy"></a>




- **AWS CodeDeploy**
  - **Resource Type Value:** AWS::CodeDeploy::Application / **Relationship:** contains / **Related Resource:** DeploymentGroup / **Notes:** 
  - **Resource Type Value:** AWS::CodeDeploy::DeploymentConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::CodeDeploy::DeploymentGroup / **Relationship:** is contained in / **Related Resource:** Application / **Notes:** 



## AWS CodePipeline
<a name="awscodepipeline"></a>




- **AWS CodePipeline **
  - **Resource Type Value:** AWS::CodePipeline::Pipeline\*
  - **Relationship:** is attached to  / **Related Resource:** S3 bucket  / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** IAM role / **Notes:** 
  - **Related Resource:** Code project  / **Notes:** 
  - **Related Resource:** Lambda function / **Notes:** 
  - **Related Resource:** Cloudformation stack / **Notes:** 
  - **Related Resource:** ElasticBeanstalk application / **Notes:** 



\*AWS Config records configuration changes to CodePipeline pipelines and supported resource types in the pipelines. AWS Config does not record configuration changes for resource types in the pipelines that are not yet supported. Unsupported resource types such as `CodeCommit repository, CodeDeploy application, ECS cluster,` and `ECS service` appear in the supplementary configuration section of the configuration item for the stack. 

## AWS Config
<a name="awsconfig"></a>




- **AWS Config**
  - **Resource Type Value:** AWS::Config::AggregationAuthorization / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Config::ResourceCompliance\* / **Relationship:** is associated with / **Related Resource:** All resources\* / **Notes:** 
  - **Resource Type Value:** AWS::Config::ConformancePackCompliance / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Config::ConfigurationRecorder\* / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Config::ConformancePack / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Config::StoredQuery / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



\*The relationship between `AWS::Config::ResourceCompliance` and a related resource depends on how `AWS::Config::ResourceCompliance` reports compliance for that specific resource type.

\*`AWS::Config::ConfigurationRecorder` is a system resource type of AWS Config and recording of this resource type is enabled by default.

**Note**  
Recording for the `AWS::Config::ConformancePackCompliance` and `AWS::Config::ConfigurationRecorder` resource types come with no additional charge.

## AWS Cost Explorer
<a name="awscostexplorer"></a>




- **AWS Cost Explorer**
  - **Resource Type Value:** AWS::CE::CostCategory
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



## AWS Database Migration Service
<a name="awsdms"></a>




- **AWS Database Migration Service**
  - **Resource Type Value:** AWS::DMS::EventSubscription / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DMS::ReplicationSubnetGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DMS::ReplicationInstance / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DMS::ReplicationTask / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DMS::Certificate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DMS::Endpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS DataSync
<a name="awsdatasync"></a>




- **AWS DataSync**
  - **Resource Type Value:** AWS::DataSync::Agent / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataSync::LocationSMB / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataSync::LocationFSxLustre / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataSync::LocationFSxWindows / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataSync::LocationS3 / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataSync::LocationEFS / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataSync::LocationNFS / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataSync::LocationHDFS / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataSync::LocationObjectStorage / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataSync::Task / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon Aurora DSQL
<a name="awsdsql"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon Aurora DSQL | AWS::DSQL::Cluster | NA | NA |  | 

## AWS Deadline Cloud
<a name="awsdeadlinecloud"></a>




- **AWS Deadline Cloud**
  - **Resource Type Value:** AWS::Deadline::Fleet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Deadline::LicenseEndpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Deadline::Monitor / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Deadline::QueueEnvironment / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.
  - **Resource Type Value:** AWS::Deadline::QueueFleetAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Deadline::StorageProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Device Farm
<a name="awsdevicefarm"></a>




- **AWS Device Farm**
  - **Resource Type Value:** AWS::DeviceFarm::TestGridProject / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DeviceFarm::InstanceProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DeviceFarm::Project / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Elastic Beanstalk
<a name="awselasticbeanstalk"></a>




- **AWS Elastic Beanstalk**
  - **Resource Type Value:** AWS::ElasticBeanstalk::Application / **Relationship:** contains / **Related Resource:** Elastic Beanstalk Application Version / **Notes:** 
  - **Related Resource:** Elastic Beanstalk Environment / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** IAM role / **Notes:** 
  - **Resource Type Value:** AWS::ElasticBeanstalk::ApplicationVersion / **Relationship:** is contained in / **Related Resource:** Elastic Beanstalk Application / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** Elastic Beanstalk Environment / **Notes:** 
  - **Related Resource:** S3 bucket / **Notes:** 
  - **Resource Type Value:** AWS::ElasticBeanstalk::Environment / **Relationship:** is contained in / **Related Resource:** Elastic Beanstalk Application / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** Elastic Beanstalk Application Version / **Notes:** 
  - **Related Resource:** IAM role / **Notes:** 
  - **Relationship:** contains / **Related Resource:** CloudFormation Stack / **Notes:** 



## AWS Entity Resolution
<a name="awsentityresolution"></a>




- **AWS Entity Resolution**
  - **Resource Type Value:** AWS::EntityResolution::IdMappingWorkflow / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EntityResolution::MatchingWorkflow / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::EntityResolution::SchemaMapping / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Fault Injection Service
<a name="awsfis"></a>




- **AWS Fault Injection Service**
  - **Resource Type Value:** AWS::FIS::ExperimentTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::FIS::TargetAccountConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Global Accelerator
<a name="awsglobalaccelerator"></a>




- **AWS Global Accelerator**
  - **Resource Type Value:** AWS::GlobalAccelerator::Listener / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GlobalAccelerator::EndpointGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GlobalAccelerator::Accelerator / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Glue
<a name="awsglue"></a>




- **AWS Glue**
  - **Resource Type Value:** AWS::Glue::Classifier / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Glue::Crawler / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Glue::Database / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Glue::Job / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Glue::MLTransform / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Glue::Registry / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Glue DataBrew
<a name="awsgluedatabrew"></a>




- **AWS Glue DataBrew**
  - **Resource Type Value:** AWS::DataBrew::Dataset / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataBrew::Job / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataBrew::Project / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataBrew::Recipe / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataBrew::Ruleset / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::DataBrew::Schedule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Ground Station
<a name="aws-ground-station"></a>




- **AWS Ground Station**
  - **Resource Type Value:** AWS::GroundStation::Config / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GroundStation::MissionProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::GroundStation::DataflowEndpointGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS HealthLake
<a name="amazonhealthlake"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS HealthLake | AWS::HealthLake::FHIRDatastore | NA | NA |  | 

## AWS Identity and Access Management (IAM)
<a name="awsiam"></a>




- **AWS Identity and Access Management**
  - **Resource Type Value:** AWS::IAM::User / **Relationship:** is attached to / **Related Resource:** IAM group / **Notes:** 
  - **Related Resource:** IAM customer managed policy / **Notes:** 
  - **Resource Type Value:** AWS::IAM::UserPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** Resource metadata is included in the associated AWS::IAM::User CI
  - **Resource Type Value:** AWS::IAM::Group / **Relationship:** contains / **Related Resource:** IAM user / **Notes:** 
  - **Relationship:** is attached to / **Related Resource:** IAM customer managed policy / **Notes:** 
  - **Resource Type Value:** AWS::IAM::GroupPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** Resource metadata is included in the associated AWS::IAM::Group CI
  - **Resource Type Value:** AWS::IAM::Role / **Relationship:** is attached to / **Related Resource:** IAM customer managed policy / **Notes:** 
  - **Resource Type Value:** AWS::IAM::RolePolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** Resource metadata is included in the associated AWS::IAM::Role CI
  - **Resource Type Value:** AWS::IAM::Policy / **Relationship:** is attached to / **Related Resource:** IAM user / **Notes:** 
  - **Related Resource:** IAM group / **Notes:** 
  - **Related Resource:** IAM role / **Notes:** 
  - **Resource Type Value:** AWS::IAM::SAMLProvider / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IAM::ServerCertificate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IAM::InstanceProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IAM::OIDCProvider / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS Identity and Access Management Access Analyzer**
  - **Resource Type Value:** AWS::AccessAnalyzer::Analyzer
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **AWS Identity and Access Management Roles Anywhere**
  - **Resource Type Value:** AWS::RolesAnywhere::Profile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::RolesAnywhere::CRL / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::RolesAnywhere::TrustAnchor / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



AWS Config includes inline policies with the configuration details that it records. For more information on inline policies, see [Managed policies and inline policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html#inline-policies) in the IAM User Guide.

## AWS IoT
<a name="awsiot"></a>



- **AWS IoT**
  - **Resource Type Value:** AWS::IoT::AccountAuditConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::Authorizer / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::BillingGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::CACertificate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::CustomMetric / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::Dimension / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::DomainConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::JobTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::MitigationAction / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::Policy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::ProvisioningTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::RoleAlias / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::ResourceSpecificLogging / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::ScheduledAudit / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::SecurityProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::SoftwarePackage / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::ThingGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoT::TopicRule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS IoT Wireless**
  - **Resource Type Value:** AWS::IoTWireless::Destination / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTWireless::DeviceProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTWireless::FuotaTask / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTWireless::ServiceProfile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTWireless::MulticastGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTWireless::NetworkAnalyzerConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTWireless::TaskDefinition / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTWireless::WirelessGateway / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS IoT Core**
  - **Resource Type Value:** AWS::IoT::FleetMetric
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **AWS IoT Core Device Advisor**
  - **Resource Type Value:** AWS::IoTCoreDeviceAdvisor::SuiteDefinition
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **AWS IoT Analytics**
  - **Resource Type Value:** AWS::IoTAnalytics::Datastore / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTAnalytics::Dataset / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTAnalytics::Pipeline / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTAnalytics::Channel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS IoT Events**
  - **Resource Type Value:** AWS::IoTEvents::Input / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTEvents::DetectorModel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTEvents::AlarmModel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS IoT TwinMaker**
  - **Resource Type Value:** AWS::IoTTwinMaker::Workspace / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTTwinMaker::Entity / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTTwinMaker::Scene / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTTwinMaker::SyncJob / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTTwinMaker::ComponentType / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS IoT SiteWise**
  - **Resource Type Value:** AWS::IoTSiteWise::Asset / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTSiteWise::AssetModel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTSiteWise::Dashboard / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTSiteWise::Gateway / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTSiteWise::Portal / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::IoTSiteWise::Project / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS IoT Greengrass Version 2**
  - **Resource Type Value:** AWS::GreengrassV2::ComponentVersion
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



## AWS Key Management Service
<a name="awskeymanagementservice"></a>




- **AWS Key Management Service**
  - **Resource Type Value:** AWS::KMS::Key / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::KMS::Alias / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Lambda
<a name="awslambda"></a>




- **AWS Lambda**
  - **Resource Type Value:** AWS::Lambda::Function / **Relationship:** is associated with / **Related Resource:** IAM role / **Notes:** 
  - **Related Resource:** EC2 security group / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** EC2 subnet / **Notes:** 
  - **Resource Type Value:** AWS::Lambda::CodeSigningConfig / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Mainframe Modernization
<a name="awsmainframemodernization"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS Mainframe Modernization | AWS::M2::Environment | NA | NA |  | 

## AWS Network Firewall
<a name="awsnetworkfirewall"></a>




- **AWS Network Firewall**
  - **Resource Type Value:** AWS::NetworkFirewall::ContainerAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkFirewall::Firewall / **Relationship:** is attached to / **Related Resource:** EC2 Subnet / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** NetworkFirewall FirewallPolicy / **Notes:** 
  - **Resource Type Value:** AWS::NetworkFirewall::FirewallPolicy / **Relationship:** is associated with  / **Related Resource:** NetworkFirewall RuleGroup / **Notes:** 
  - **Resource Type Value:** AWS::NetworkFirewall::RuleGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkFirewall::TLSInspectionConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkFirewall::VpcEndpointAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Network Manager
<a name="awsnetworkmanager"></a>




- **AWS Network Manager**
  - **Resource Type Value:** AWS::NetworkManager::TransitGatewayRegistration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkManager::Site / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkManager::Device / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkManager::Link / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkManager::GlobalNetwork / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkManager::CustomerGatewayAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkManager::LinkAssociation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkManager::ConnectPeer / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::NetworkManager::TransitGatewayPeering / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Organizations
<a name="awsorganizations"></a>




- **AWS Organizations**
  - **Resource Type Value:** AWS::Organizations::OrganizationalUnit
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



## AWS HealthOmics
<a name="awshealthomics"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS HealthOmics | AWS::Omics::ReferenceStore | NA | NA |  | 

## AWS Panorama
<a name="awspanorama"></a>




- **AWS Panorama**
  - **Resource Type Value:** AWS::Panorama::Package
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



## AWS Private Certificate Authority
<a name="awsprivateca"></a>




- **AWS Private Certificate Authority**
  - **Resource Type Value:** AWS::ACMPCA::CertificateAuthority / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ACMPCA::CertificateAuthorityActivation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS Private CA Connector for Active Directory**
  - **Resource Type Value:** AWS::PCAConnectorAD::Connector / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::PCAConnectorAD::DirectoryRegistration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::PCAConnectorAD::Template / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.

- **AWS Private CA Connector for SCEP**
  - **Resource Type Value:** AWS::PCAConnectorSCEP::Challenge / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.
  - **Resource Type Value:** AWS::PCAConnectorSCEP::Connector / **Relationship:** NA / **Related Resource:** NA / **Notes:** Recording configuration items for resource deletion events might take up to 120 hours to reflect in AWS Config.



## AWS Resilience Hub
<a name="awsresiliencehub"></a>




- **AWS Resilience Hub**
  - **Resource Type Value:** AWS::ResilienceHub::ResiliencyPolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ResilienceHub::App / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Resource Explorer
<a name="awsresourceexplorer"></a>




- **AWS Resource Explorer**
  - **Resource Type Value:** AWS::ResourceExplorer2::Index / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::ResourceExplorer2::View / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Resource Groups
<a name="awsresourcegroups"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS Resource Groups | AWS::ResourceGroups::Group | NA | NA |  | 

## AWS Resource Access Manager
<a name="awsram"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS Resource Access Manager | AWS::RAM::ResourceShare | NA | NA |  | 

## AWS RoboMaker
<a name="awsrobomaker"></a>




- **AWS RoboMaker**
  - **Resource Type Value:** AWS::RoboMaker::RobotApplicationVersion / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::RoboMaker::RobotApplication / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::RoboMaker::SimulationApplication / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Signer
<a name="awssigner"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS Signer | AWS::Signer::SigningProfile | NA | NA |  | 

## AWS Secrets Manager
<a name="awssecretsmanager"></a>




- **AWS Secrets Manager**
  - **Resource Type Value:** AWS::SecretsManager::Secret / **Relationship:** is associated with / **Related Resource:** Lambda function / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** KMS Key / **Notes:** 
  - **Resource Type Value:** AWS::SecretsManager::ResourcePolicy / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SecretsManager::RotationSchedule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Security Hub CSPM
<a name="awssecurityhub"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS Security Hub CSPM | AWS::SecurityHub::Standard | NA | NA |  | 

## AWS Service Catalog
<a name="awsservicecatalog"></a>




- **AWS Service Catalog**
  - **Resource Type Value:** AWS::ServiceCatalog::CloudFormationProduct / **Relationship:** is contained in / **Related Resource:** Portfolio / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** CloudFormationProvisionedProduct / **Notes:** 
  - **Resource Type Value:** AWS::ServiceCatalog::CloudFormationProvisionedProduct / **Relationship:** is associated with / **Related Resource:** Portfolio / **Notes:** 
  - **Related Resource:** CloudFormationProduct / **Notes:** 
  - **Related Resource:** CloudFormationStack / **Notes:** 
  - **Resource Type Value:** AWS::ServiceCatalog::Portfolio / **Relationship:** contains / **Related Resource:** CloudFormationProduct / **Notes:** 



**Note**  
When you use AWS Service Catalog with AWS Config, configuration items show the child provisioned product's ARN instead of the parent product's ARN. This happens when a AWS Service Catalog provisioned product serves as a resource within a parent provisioned product through CloudFormation. The resource ID remains trackable through the AWS Config interfaces.

## AWS Shield
<a name="awsshield"></a>




- **AWS Shield**
  - **Resource Type Value:** AWS::Shield::Protection / **Relationship:** is associated with / **Related Resource:** Amazon CloudFront distribution / **Notes:** 
  - **Resource Type Value:** AWS::ShieldRegional::Protection / **Relationship:** is associated with / **Related Resource:** EC2 EIP / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** ElasticLoadBalancing Balancer  / **Notes:** 
  - **Relationship:** is associated with / **Related Resource:** ElasticLoadBalancingV2 LoadBalancer / **Notes:** 



## AWS Step Functions
<a name="awsstepfunctions"></a>




- **AWS Step Functions**
  - **Resource Type Value:** AWS::StepFunctions::Activity / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::StepFunctions::StateMachine / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## Amazon EventBridge Scheduler
<a name="amazoneventbridgescheduler"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| Amazon EventBridge Scheduler | AWS::Scheduler::ScheduleGroup | NA | NA |  | 

## AWS Systems Manager
<a name="awssystemsmanager"></a>




- **AWS Systems Manager**
  - **Resource Type Value:** AWS::SSM::AssociationCompliance / **Relationship:** is associated with / **Related Resource:** Managed Instance Inventory / **Notes:** 
  - **Resource Type Value:** AWS::SSM::Document / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::SSM::FileData / **Relationship:** is associated with / **Related Resource:** Managed Instance Inventory / **Notes:** 
  - **Resource Type Value:** AWS::SSM::ManagedInstanceInventory\* / **Relationship:** is associated with / **Related Resource:** EC2 instance / **Notes:** 
  - **Resource Type Value:** AWS::SSM::PatchBaseline / **Relationship:** is associated with / **Related Resource:** Managed Instance Inventory / **Notes:** 
  - **Resource Type Value:** AWS::SSM::PatchCompliance / **Relationship:** is associated with / **Related Resource:** Managed Instance Inventory / **Notes:** 
  - **Resource Type Value:** AWS::SSM::ResourceDataSync / **Relationship:** NA / **Related Resource:** NA / **Notes:** 

- **AWS Systems Manager Incident Manager**
  - **Resource Type Value:** AWS::SSMIncidents::ResponsePlan
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 

- **AWS Systems Manager Incident Manager Contacts**
  - **Resource Type Value:** AWS::SSMContacts::Contact
  - **Relationship:** NA
  - **Related Resource:** NA
  - **Notes:** 



\*To learn more about managed instance inventory, see [Recording Software Configuration for Managed Instances with AWS Config](recording-managed-instance-inventory.md).

## AWS Transfer Family
<a name="awstransferfamily"></a>




- **AWS Transfer Family**
  - **Resource Type Value:** AWS::Transfer::Agreement / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Transfer::Certificate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Transfer::Connector / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Transfer::Profile / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Transfer::Server / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Transfer::User / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::Transfer::Workflow / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS WAF
<a name="awswaf"></a>




- **AWS WAF**
  - **Resource Type Value:** AWS::WAF::RateBasedRule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::WAF::Rule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::WAF::WebACL / **Relationship:** is associated with / **Related Resource:** WAF Rule / **Notes:** 
  - **Related Resource:** WAF rate based rule / **Notes:** 
  - **Related Resource:** WAF Rulegroup / **Notes:** 
  - **Resource Type Value:** AWS::WAF::RuleGroup / **Relationship:** is associated with / **Related Resource:** WAF Rule / **Notes:** 
  - **Resource Type Value:** AWS::WAFRegional::RateBasedRule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::WAFRegional::Rule / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::WAFRegional::WebACL / **Relationship:** is associated with / **Related Resource:** ElasticLoadBalancingV2 LoadBalancer / **Notes:** 
  - **Related Resource:** WAFRegional Rule / **Notes:** 
  - **Related Resource:** WAFRegional rate based rule / **Notes:** 
  - **Related Resource:** WAFRegional Rulegroup / **Notes:** 
  - **Resource Type Value:**  AWS::WAFRegional::RuleGroup / **Relationship:** is associated with / **Related Resource:** WAFRegional Rule / **Notes:** 

- **AWS WAF V2**
  - **Resource Type Value:** AWS::WAFv2::WebACL / **Relationship:** is associated with / **Related Resource:** ElasticLoadBalancingV2 LoadBalancer / **Notes:** 
  - **Related Resource:** ApiGateway Stage / **Notes:** 
  - **Related Resource:** WAFv2 IPSet / **Notes:** 
  - **Related Resource:** WAFv2 RegexPatternSet / **Notes:** 
  - **Related Resource:** WAFv2 RuleGroup / **Notes:** 
  - **Related Resource:** WAFv2 ManagedRuleSet / **Notes:** 
  - **Resource Type Value:** AWS::WAFv2::RuleGroup / **Relationship:** is associated with / **Related Resource:** WAFv2 IPSet / **Notes:** 
  - **Related Resource:** WAFv2 RegexPatternSet / **Notes:** 
  - **Resource Type Value:** AWS::WAFv2::ManagedRuleSet / **Relationship:** is associated with / **Related Resource:** WAFv2 RuleGroup / **Notes:** 
  - **Resource Type Value:** AWS::WAFv2::IPSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::WAFv2::RegexPatternSet / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS X-Ray
<a name="awsxray"></a>



| AWS Service | Resource Type Value | Relationship | Related Resource | Notes | 
| --- | --- | --- | --- | --- | 
| AWS X-Ray | AWS::XRay::EncryptionConfig | NA | NA |  | 

## Elastic Load Balancing
<a name="awselasticloadbalancing"></a>




- **Elastic Load Balancing**
  - **Resource Type Value:** Application Load Balancer<br />`AWS::ElasticLoadBalancingV2::LoadBalancer` / **Relationship:** is associated with / **Related Resource:** EC2 security group / **Notes:** 
  - **Relationship:** is attached to / **Related Resource:** Subnet / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** Application Load Balancer Listener <br />`AWS::ElasticLoadBalancingV2::Listener` / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** Application Load Balancer Target Group <br />`AWS::ElasticLoadBalancingV2::TargetGroup` / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** Classic Load Balancer<br />`AWS::ElasticLoadBalancing::LoadBalancer` / **Relationship:** is associated with / **Related Resource:** EC2 security group / **Notes:** 
  - **Relationship:** is attached to / **Related Resource:** Subnet / **Notes:** 
  - **Relationship:** is contained in / **Related Resource:** Virtual private cloud (VPC) / **Notes:** 
  - **Resource Type Value:** Network Load Balancer <br />`AWS::ElasticLoadBalancingV2::LoadBalancer` / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Elemental MediaConnect
<a name="awsconnect"></a>




- **AWS Elemental MediaConnect**
  - **Resource Type Value:** AWS::MediaConnect::FlowEntitlement / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaConnect::FlowVpcInterface / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaConnect::FlowSource / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaConnect::Gateway / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Elemental MediaLive
<a name="awselementalmedialive"></a>




- **AWS Elemental MediaLive**
  - **Resource Type Value:** AWS::MediaLive::CloudWatchAlarmTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaLive::CloudWatchAlarmTemplateGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaLive::EventBridgeRuleTemplate / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaLive::EventBridgeRuleTemplateGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Elemental MediaPackage
<a name="awselementalmediapackage"></a>




- **AWS Elemental MediaPackage**
  - **Resource Type Value:** AWS::MediaPackage::PackagingGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaPackage::PackagingConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Elemental MediaPackage V2
<a name="awselementalmediapackagev2"></a>




- **AWS Elemental MediaPackage V2**
  - **Resource Type Value:** AWS::MediaPackageV2::Channel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaPackageV2::ChannelGroup / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaPackageV2::OriginEndpoint / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## AWS Elemental MediaTailor
<a name="awselementalmediatailor"></a>




- **AWS Elemental MediaTailor**
  - **Resource Type Value:** AWS::MediaTailor::Channel / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaTailor::LiveSource / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaTailor::PlaybackConfiguration / **Relationship:** NA / **Related Resource:** NA / **Notes:** 
  - **Resource Type Value:** AWS::MediaTailor::SourceLocation / **Relationship:** NA / **Related Resource:** NA / **Notes:** 



## See also

* **Skills for AI coding assistants (optional).** AWS publishes reusable skills for AWS Config. To see which apply, search the Agent Toolkit for AWS catalog with `aws agent-toolkit search-skills --search-query config` — a documented, read-only AWS CLI command that searches the catalog and makes no changes. This is an optional suggestion for the user. Official reference: [AWS CLI — Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html).
