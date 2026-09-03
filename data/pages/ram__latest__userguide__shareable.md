

# Shareable AWS resources
<a name="shareable"></a><a name="permissions-rbp-supported-resource-types"></a>

With AWS Resource Access Manager (AWS RAM), you can share resources that are created and managed by other AWS services. You can share resources with individual AWS accounts. You can also share resources with the accounts in an organization or organizational units (OUs) in AWS Organizations. Some supported resource types also let you share resources with individual AWS Identity and Access Management (IAM) roles and users. 

The following sections list the resource types, grouped by AWS service, that you can share by using AWS RAM. The columns in the tables specify which features each resource type supports:


|  |  | 
| --- |--- |
| **Can share with IAM users and roles** |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  – you can share resources of this type with individual AWS Identity and Access Management (IAM) roles and users, in addition to accounts.<br /> ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  – you can share resources of this type with only accounts.  | 
| **Can share with accounts outside its organization** |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  – you may only share resources of this type with individual accounts, inside or outside of its organization. See [Considerations](https://docs.aws.amazon.com/ram/latest/userguide/getting-started-sharing.html#getting-started-sharing-create) for more information.<br /> ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  – you can share resources of this type with only accounts that are members of the same organization. | 
| **Can use customer managed permissions** | All resource types supported by AWS RAM support AWS managed permissions, but a Yes in this column means that customer managed permissions is also supported for this resource type.<br /> ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  – resources of this type support the use of customer managed permissions.<br /> ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  – resources of this type do not support the use of customer managed permissions. | 
| **Can share with service principals** |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  – you can share resources of this type with AWS services. <br /> ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  – you can't share resources of this type with AWS services. | 

## AWS App Mesh
<a name="shareable-appmesh"></a>

You can share the following AWS App Mesh resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Meshes<br />`appmesh:Mesh` | Create and manage a mesh centrally, and share it with other AWS accounts or your organization. A shared mesh allows resources created by different AWS accounts to communicate with each other in the same mesh. For more information, see [ Working with shared meshes](https://docs.aws.amazon.com/app-mesh/latest/userguide/sharing.html) in the *AWS App Mesh User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS AppSync GraphQL API
<a name="shareable-appsync-graphql"></a>

You can share the following AWS AppSync GraphQL API resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| AppSync GraphyQL APIs<br />`appsync:Apis` | Manage AWS AppSync GraphQL APIs centrally, and share them with other AWS accounts or your organization. This lets multiple accounts share AWS AppSync APIs as part of creating a unified AWS AppSync Merged API which can access data from multiple subschema APIs across different accounts in the same Region. For more information, see [Merged APIs](https://docs.aws.amazon.com/appsync/latest/devguide/merged-api.html) in the * AWS AppSync Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon API Gateway
<a name="shareable-api-gateway"></a>

You can share the following Amazon API Gateway resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| API Gateway Private Custom Domains<br />`apigateway:Domainnames` | Create and manage domain names centrally, and share them with other AWS accounts or your organization. This lets multiple accounts invoke your domain names that are mapped to private APIs. For more information, see [Custom domain names for private APIs in API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-private-custom-domains.html) in the *Amazon API Gateway Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon Application Recovery Controller (ARC)
<a name="shareable-r53-app-rec-controller"></a>

You can share the following Amazon Application Recovery Controller (ARC) resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Route 53 ARC Clusters<br />`route53-recovery-control:Cluster` | Create and manage ARC clusters centrally, and share them with other AWS accounts or your organization. This lets multiple accounts create control panels and routing controls in a single shared cluster, reducing complexity and the total number of clusters an organization requires. For more information, see [Sharing clusters across accounts](https://docs.aws.amazon.com/r53recovery/latest/dg/routing-control.failover-different-accounts.html) in the *Amazon Application Recovery Controller (ARC) Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| ARC Region switch plans<br />`arc-region-switch:Plan` | Create and manage plans centrally, and share them with other AWS accounts or your organization. This lets multiple accounts use resources from an account that is different from the account that hosts the plan. For more information, see [Region switch](https://docs.aws.amazon.com/r53recovery/latest/dg/region-switch.html) in the *Amazon Application Recovery Controller (ARC) Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon Aurora
<a name="shareable-aur"></a>

You can share the following Amazon Aurora resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Aurora DB Clusters<br />`rds:Cluster` | Create and manage a DB cluster centrally, and share it with other AWS accounts or your organization. This lets multiple AWS accounts clone a shared, centrally managed DB cluster. For more information, see [ Cross-account cloning with AWS RAM and Amazon Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Managing.Clone.html#Aurora.Managing.Clone.Cross-Account) in the *Amazon Aurora User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Backup
<a name="shareable-backup"></a>

You can share the following AWS Backup resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Backup Vaults<br />`backup:BackupVault` | Create and manage logically air-gapped vaults centrally and share them with other AWS accounts or your organization. This option lets multiple accounts access and restore backups from the vault(s). For more information, see [Overview of logically air gapped vaults](https://docs.aws.amazon.com/aws-backup/latest/devguide/logicallyairgappedvault.html) in the *AWS Backup Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon Bedrock
<a name="shareable-bedrock"></a>

You can share the following Amazon Bedrock resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Bedrock Custom Model<br />`bedrock:CustomModel` | Create and manage custom model centrally, and share it with other AWS accounts or your organization. This lets multiple accounts use the same custom model for generative AI applications. For more information, see [Share a model for another account](https://docs.aws.amazon.com/bedrock/latest/userguide/share-model.html) in the *Amazon Bedrock User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Billing and Cost Management
<a name="shareable-bcm"></a>

You can share the following Billing and Cost Management resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| BCM Dashboards<br />`bcm-dashboards:dashboard` | Create and manage Billing and Cost Management dashboards and share them with other AWS accounts within or outside your organization. When you share a dashboard, only dashboard configurations are shared, not the underlying data. Recipients receive access to the dashboard layout and widget configurations, and will see data based on their own access permissions. This sharing capability allows organizations to establish common cost reporting practices and helps different teams view cost data consistently. For more information, see [Sharing dashboards](https://docs.aws.amazon.com/cost-management/latest/userguide/share-dashboards.html) in the *Billing and Cost Management User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Billing View Service
<a name="shareable-billing"></a>

You can share the following AWS Billing View Service resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Billing Views<br />`billing:billingview` | Create and manage custom billing views centrally, and share them with other AWS accounts or your organization. This lets application and business unit owners access business unit-level AWS spend from a member account. For more information, see [Sharing custom billing views](https://docs.aws.amazon.com/cost-management/latest/userguide/share-custom-billing-views.html) in the *AWS Cost Management User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Cloud Map
<a name="shareable-cloudmap"></a>

You can share the following AWS Cloud Map resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| AWS Cloud Map Namespaces<br />`servicediscovery:Namespace` | Create and manage namespaces centrally, and share them with other AWS accounts within your organization. This lets multiple AWS accounts discover services and instances in the shared namespace without the need for temporary credentials. For more information, see [Shared AWS Cloud Map namespaces](https://docs.aws.amazon.com/cloud-map/latest/dg/sharing-namespaces.html) in the *AWS Cloud Map Developer Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Cloud WAN
<a name="shareable-globalwan"></a>

You can share the following AWS Cloud WAN resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Core networks<br />`networkmanager:CoreNetwork` | Create and manage a Cloud WAN core network centrally, and share it with other AWS accounts. This lets multiple AWS accounts access and provision hosts on a single Cloud WAN core network. For more information, see [Share a core network](https://docs.aws.amazon.com/vpc/latest/cloudwan/cloudwan-share-network.html) in the *AWS Cloud WAN User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon CloudFront
<a name="shareable-cloudfront"></a>

You can share the following Amazon CloudFront resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Amazon CloudFront VpcOrigin<br />`cloudfront:VpcOrigin` | Create and manage CloudFront VPC origins centrally, and share it with other AWS accounts or your organization. This lets multiple AWS accounts use a shared VPC origins for CloudFront distributions. For more information, see [Working with shared resources in CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/sharing-resources.html) in the *Amazon CloudFront Developer Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS CloudHSM
<a name="shareable-cloudHSM"></a>

You can share the following AWS CloudHSM resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| AWS CloudHSM Backups<br />`cloudhsm:Backup` | Manage AWS CloudHSM Backups centrally, and share them with other AWS accounts or your organization. This lets multiple AWS accounts and users view information about the Backup and use it to restore a AWS CloudHSM Cluster. For more information, see [Managing AWS CloudHSM backups](https://docs.aws.amazon.com/cloudhsm/latest/userguide/manage-backups.html) in the *AWS CloudHSM User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS CodeBuild
<a name="shareable-codebuild"></a>

You can share the following AWS CodeBuild resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| CodeBuild Projects<br />`codebuild:Project` | Create a project, and use it to run builds. Share the project with other AWS accounts or your organization. This lets multiple AWS accounts and users view information about a project and analyze its builds. For more information, see [Working with shared projects](https://docs.aws.amazon.com/codebuild/latest/userguide/project-sharing.html) in the * AWS CodeBuild User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| CodeBuild Report groups<br />`codebuild:ReportGroup` | Create a report group, and use it to create reports when you build a project. Share the report group with other AWS accounts or your organization. This lets multiple AWS accounts and users view the report group and its reports, and the test case results for each report. A report can be viewed for 30 days after it's created, and then it expires and is no longer available to view. For more information, see [Working with shared projects](https://docs.aws.amazon.com/codebuild/latest/userguide/project-sharing.html) in the *AWS CodeBuild User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS CodeConnections
<a name="shareable-codeconnections"></a>

You can share the following CodeConnections resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Code Connections<br />`codeconnections:Connection` | Manage the reuse of code connections in multiple accounts. In other words, sharing code connections reduces the administrator burden and need for administrator access in every account that requires a code connection. For more information, see [Share connections with AWS accounts](https://docs.aws.amazon.com/dtconsole/latest/userguide/connections-share.html) in the *Developer Tools Console User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon DataZone
<a name="shareable-datazone"></a>

You can share the following DataZone resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| DataZone Domains<br />`datazone:Domain` | Create and manage domains centrally, and share it with other AWS accounts or your organization. This lets multiple accounts create Amazon DataZone domains. For more information, see [What is Amazon DataZone](https://docs.aws.amazon.com/datazone/latest/userguide/what-is-datazone.html) in the *Amazon DataZone User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon EC2
<a name="shareable-ec2"></a>

You can share the following Amazon EC2 resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Capacity reservations<br />`ec2:CapacityReservation` | Create and manage capacity reservations centrally, and share the reserved capacity with other AWS accounts or your organization. This lets multiple AWS accounts launch their Amazon EC2 instances into centrally managed reserved capacity. For more information, see [Working with shared Capacity Reservations](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/capacity-reservation-sharing.html) in the *Amazon EC2 User Guide*.<br />Share Capacity Blocks for ML (UltraServer CBs are not yet supported) with other AWS accounts or your organization. This capability enables workloads running in different AWS accounts to launch Amazon EC2 instances into Capacity Blocks you own, helping you better utilize your reserved capacity and save costs. For more information, see [ Working with shared Capacity Blocks](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/capacity-blocks-share.html) in the *Amazon EC2 User Guide*. If you don't meet all of the [prerequisites for sharing a capacity reservation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/capacity-reservation-sharing.html#sharing-cr-prereq), then the sharing operation can fail. If this happens and a user attempts to launch an Amazon EC2 instance into that capacity reservation, it launches as an on-demand instance that can accrue higher costs. We recommend that you verify that you can access the shared capacity reservation by attempting to [view it in the Amazon EC2 console](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/capacity-reservation-sharing.html#identifying-shared-cr). You can also monitor for failed resource shares so that you can take corrective action before users launch instances in ways that raise your costs. For more information, see [Example: Alerting on resource share failures](using-eventbridge.md#using-eventbridge-example-sharing).  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | Yes for Capacity Reservations (Can share with **any** AWS account).<br />No for Capacity Blocks (Can share with **only** AWS accounts in its own organization). |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Dedicated hosts<br />`ec2:DedicatedHost` | Allocate and manage Amazon EC2 dedicated hosts centrally, and share the host's instance capacity with other AWS accounts or your organization. This lets multiple AWS accounts launch their Amazon EC2 instances on to centrally managed dedicated hosts. For more information, see [ Working with shared Dedicated Hosts](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dh-sharing.html) in the *Amazon EC2 User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Placement groups<br />`ec2:PlacementGroup` | Share the placement groups you own across your AWS accounts, both within and outside your organization. You can launch Amazon EC2 instances from any of the accounts you share with into a shared placement group. For more information, see, [Share a placement group](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/share-placement-group.html) in the Amazon EC2 User Guide. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## EC2 Image Builder
<a name="shareable-imagebuilder"></a>

You can share the following EC2 Image Builder resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Image Builder Components<br />`imagebuilder:Component` | Create and manage components centrally, and share them with other AWS accounts or your organization. Manage who can use predefined build and test components in their image recipes. For more information, see [ Share EC2 Image Builder resources](https://docs.aws.amazon.com/imagebuilder/latest/userguide/manage-shared-resources.html) in the *EC2 Image Builder User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Image Builder Container recipes<br />`imagebuilder:ContainerRecipe` | Create and manage your container recipes centrally, and share them with other AWS accounts or your organization. This allows you to manage who can use predefined documents to duplicate container image builds. For more information, see [ Share EC2 Image Builder resources](https://docs.aws.amazon.com/imagebuilder/latest/userguide/manage-shared-resources.html) in the *EC2 Image Builder User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Image Builder Images<br />`imagebuilder:Image` | Create and manage your golden images centrally, and share them with other AWS accounts or your organization. Manage who can use images created with EC2 Image Builder across your organization. For more information, see [ Share EC2 Image Builder resources](https://docs.aws.amazon.com/imagebuilder/latest/userguide/manage-shared-resources.html) in the *EC2 Image Builder User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Image Builder Image recipes<br />`imagebuilder:ImageRecipe` | Create and manage your image recipes centrally, and share them with other AWS accounts or your organization. This allows you to manage who can use predefined documents to duplicate AMI builds. For more information, see [ Share EC2 Image Builder resources](https://docs.aws.amazon.com/imagebuilder/latest/userguide/manage-shared-resources.html) in the *EC2 Image Builder User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Elastic Load Balancing
<a name="shareable-elb"></a>

You can share the following Elastic Load Balancing resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| ELB Trust stores<br />`elasticloadbalancing:TrustStore` | Create and manage Elastic Load Balancing trust stores centrally, and share them with other AWS accounts or your organization. Security admins can maintain a single or smaller number of trust stores and enable Mutual TLS configurations across Application Load Balancers. For more information, see [Share your Elastic Load Balancing trust store for Application Load Balancers ](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/trust-store-sharing.html) in the * User Guide for Application Load Balancers*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS End User Messaging SMS
<a name="shareable-pinpoint"></a>

You can share the following AWS End User Messaging SMS resource by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| AWS SMS Voice Opt out lists`sms-voice:OptOutList` | Create an opt-out list and share it with other AWS accounts in your organization. You can share the opt-out list so the other applications can opt out user's phone numbers from different AWS accounts or they can check the status of the user's phone number. For more information, see [Working with shared resources](https://docs.aws.amazon.com/sms-voice/latest/userguide/shared-resources.html) in the in AWS End User Messaging SMS User Guide. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| AWS SMS Voice Phone numbers<br />`sms-voice:PhoneNumber` | Create and manage phone numbers to share them with other AWS accounts or your organization. This lets multiple AWS accounts send messages using the shared phone number. For more information, see [Working with shared resources](https://docs.aws.amazon.com/sms-voice/latest/userguide/shared-resources.html) in the in AWS End User Messaging SMS User Guide. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  | 
| AWS SMS Voice Pool<br />`sms-voice:Pool` | Create and manage pools to share them with other AWS accounts or your organization. This lets multiple AWS accounts send messages using the shared pool. For more information, see [Working with shared resources](https://docs.aws.amazon.com/sms-voice/latest/userguide/shared-resources.html) in the in AWS End User Messaging SMS User Guide. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  | 
| AWS SMS Voice Sender IDs<br />`sms-voice:SenderId` | Create and manage sender IDs and share them with other AWS accounts or your organization. This lets multiple AWS accounts send messages using the shared sender ID. For more information, see [Working with shared resources](https://docs.aws.amazon.com/sms-voice/latest/userguide/shared-resources.html) in the in AWS End User Messaging SMS User Guide. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  | 

## Amazon FSx for OpenZFS
<a name="shareable-fsx"></a>

You can share the following Amazon FSx for OpenZFS resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| FSx Volumes<br />`fsx:Volume` | Create and manage FSx for OpenZFS volumes centrally, and share them with other AWS accounts or your organization. This lets multiple accounts perform data replication using OpenZfs snapshots under shared volumes through FSx APIs `CreateVolume` or `CopySnapshotAndUpdateVolume`. For more information, see [On-demand data replication](https://docs.aws.amazon.com/fsx/latest/OpenZFSGuide/on-demand-replication.html) in the *Amazon FSx for OpenZFS User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Glue
<a name="shareable-glue"></a>

You can share the following AWS Glue resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| AWS Glue Catalog<br />`glue:Catalog` | Manage a central data catalog, and share metadata about databases and tables with AWS accounts or your organization. This enables users to run queries on data across multiple accounts. For more information, see [Sharing Data Catalog Tables and Databases Across AWS Accounts](https://docs.aws.amazon.com/lake-formation/latest/dg/sharing-catalog-resources.html) in the *AWS Lake Formation Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| AWS Glue Databases<br />`glue:Database` | Create and manage data catalog databases centrally, and share them with AWS accounts or your organization. Databases are collections of data catalog tables. This enables users to run queries and extract, transform, and load (ETL) jobs that can join and query data across multiple accounts. For more information, see [ Sharing Data Catalog Tables and Databases Across AWS Accounts](https://docs.aws.amazon.com/lake-formation/latest/dg/sharing-catalog-resources.html) in the *AWS Lake Formation Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| AWS Glue Tables<br />`glue:Table` | Create and manage data catalog tables centrally, and share them with AWS accounts or your organization. Data catalog tables contain metadata about data tables in Amazon S3, JDBC data sources, Amazon Redshift, streaming sources, and other data stores. This enables users to run queries and ETL jobs that can join and query data across multiple accounts. For more information, see [Sharing Data Catalog Tables and Databases Across AWS Accounts](https://docs.aws.amazon.com/lake-formation/latest/dg/sharing-catalog-resources.html) in the *AWS Lake Formation Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS License Manager
<a name="shareable-byol"></a>

You can share the following AWS License Manager resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| License configurations<br />`license-manager:LicenseConfiguration` | Create and manage license configurations centrally, and share them with other AWS accounts or your organization. This lets you enforce centrally managed licensing rules that are based on the terms of your enterprise agreements across multiple AWS accounts. For more information, see [License configurations in License Manager](https://docs.aws.amazon.com/license-manager/latest/userguide/license-configurations.html) in the *License Manager User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Marketplace
<a name="shareable-marketplace"></a>

You can share the following AWS Marketplace resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Marketplace Catalog Entities<br />`aws-marketplace:Entity` | Create, manage, and share entities across AWS accounts or in your organization in AWS Marketplace. For more information, see [Resource sharing in AWS RAM](https://docs.aws.amazon.com/marketplace-catalog/latest/api-reference/resource-sharing.html) in the *AWS Marketplace Catalog API Reference*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Migration Hub Refactor Spaces
<a name="shareable-mhb"></a>

You can share the following AWS Migration Hub Refactor Spaces resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Refactor Spaces Environment<br />`refactor-spaces:Environment` | Create a Refactor Spaces environment, and use it to contain your Refactor Spaces applications. Share the environment with other AWS accounts or all of the accounts in your organization. This lets multiple AWS accounts and users view information about the environment and the applications in it. For more information, see [Sharing Refactor Spaces environments using AWS RAM](https://docs.aws.amazon.com/migrationhub-refactor-spaces/latest/userguide/sharing.html) in the *AWS Migration Hub Refactor Spaces User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Multi-party approval
<a name="shareable-mpa"></a>

You can share the following Multi-party approval resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Multi-Party Approval Team<br />`mpa:ApprovalTeam` | Create and manage approval teams and share them with other AWS accounts or your organization. This allows other AWS accounts to use an approval team associated with a protected operation. A protected operation is a predefined list of operations that require team approval before it can be executed. For more information, see [Terms and Concepts](https://docs.aws.amazon.com/mpa/latest/userguide/mpa-concepts.html) in the *Multi-party approval User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Network Firewall
<a name="shareable-network-firewall"></a>

You can share the following AWS Network Firewall resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Network Firewalls<br />`network-firewall:Firewall` | Create and manage firewalls centrally, and share them with other AWS accounts so they can create firewall endpoints. This enables multiple accounts to use the protections of a single firewall. For more information, see [Sharing AWS Network Firewall resources](https://docs.aws.amazon.com/network-firewall/latest/developerguide/sharing.html) in the *AWS Network Firewall Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Network Firewall Policies<br />`network-firewall:FirewallPolicy` | Create and manage firewall policies centrally, and share them with other AWS accounts or your organization. This enables multiple accounts in an organization to share a common set of network monitoring, protection, and filtering behaviors. For more information, see [Sharing AWS Network Firewall resources](https://docs.aws.amazon.com/network-firewall/latest/developerguide/sharing.html) in the *AWS Network Firewall Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Network Firewall Rule groups<br />`network-firewall:StatefulRuleGroup`<br />`network-firewall:StatelessRuleGroup` | Create and manage stateless and stateful rule groups centrally, and share them with other AWS accounts or your organization. This enables multiple accounts in an organization in AWS Organizations to share a set of criteria for inspecting and handling network traffic. For more information, see [Sharing AWS Network Firewall resources](https://docs.aws.amazon.com/network-firewall/latest/developerguide/sharing.html) in the *AWS Network Firewall Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Oracle Database@AWS
<a name="shareable-oracle-database"></a>

You can share the following Oracle Database@AWS resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Oracle Database@AWS Exadata Infrastructure<br />`odb:CloudExadataInfrastructure` | With Oracle Database@AWS, you can share your Exadata infrastructure and your ODB network across multiple AWS accounts in the same AWS organization. This enables you to provision infrastructure once and reuse it across trusted accounts, allowing you to reduce costs while separating responsibilities. For more information, see [Resource sharing in Oracle Database@AWS](https://docs.aws.amazon.com/odb/latest/UserGuide/resource-sharing.html) in the * Oracle Database@AWS User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Oracle Database@AWS ODB network<br />`odb:OdbNetwork` | With Oracle Database@AWS, you can share your Exadata infrastructure and ODB network across multiple AWS accounts in the same AWS organization. This enables you to provision infrastructure once and reuse it across trusted accounts, allowing you to reduce costs while separating responsibilities. For more information, see [Resource sharing in Oracle Database@AWS](https://docs.aws.amazon.com/odb/latest/UserGuide/resource-sharing.html) in the * Oracle Database@AWS User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Outposts
<a name="shareable-out"></a>

You can share the following AWS Outposts resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Outposts<br />`outposts:Outpost` | Create and manage Outposts centrally, and share them with other AWS accounts in your organization. This lets multiple accounts create subnets and EBS volumes on your shared, centrally managed Outposts. For more information, see [ Working with shared AWS Outposts resources](https://docs.aws.amazon.com/outposts/latest/userguide/sharing-outposts.html) in the *AWS Outposts User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Local gateway route tables<br />`ec2:LocalGatewayRouteTable` | Create and manage VPC associations to a local gateway centrally, and share them with other AWS accounts in your organization. This lets multiple accounts create VPC associations to a local gateway, and view route table and virtual interface configuration. For more information, see [Shareable Outpost resources](https://docs.aws.amazon.com/outposts/latest/userguide/sharing-outposts.html#sharing-resources) in the *AWS Outposts User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Outposts Sites<br />`outposts:Site` | Create and manage Outpost sites and share them with other AWS accounts in your organization. This lets multiple accounts create and manage Outposts at the shared site and supports split control between the Outpost resources and the site. For more information, see [ Working with shared AWS Outposts resources](https://docs.aws.amazon.com/outposts/latest/userguide/sharing-outposts.html) in the *AWS Outposts User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon S3 on Outposts
<a name="shareable-s3outposts"></a>

You can share the following Amazon S3 on Outposts resource by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| S3 on Outpost<br />`s3-outposts:Outpost` | Create and manage Amazon S3 buckets, access points, and endpoints on the Outpost. This lets multiple accounts create and manage Outposts at the shared site and supports split control between the Outpost resources and the site. For more information, see [ Working with shared AWS Outposts resources](https://docs.aws.amazon.com/outposts/latest/userguide/sharing-outposts.html) in the *AWS Outposts User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Private Certificate Authority
<a name="shareable-pca"></a>

You can share the following AWS Private CA resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Private certificate authority (CAs)<br />`acm-pca:CertificateAuthority` | Create and manage private certificate authorities (CAs) for your organization’s internal public key infrastructure (PKI), and share those CAs with other AWS accounts or your organization. This lets AWS Certificate Manager users in other accounts issue X.509 certificates signed by your shared CA. For more information, see [Controlling access to a private CA](https://docs.aws.amazon.com/acm-pca/latest/userguide/granting-ca-access.html) in the *AWS Private Certificate Authority User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  | 

## AWS Resource Explorer
<a name="shareable-arex"></a>

You can share the following AWS Resource Explorer resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Resource Explorer Views<br />`resource-explorer-2:View` | Create and configure Resource Explorer views centrally, and share them with other AWS accounts in your organization. This lets roles and users in multiple AWS accounts search for and discover the resources accessible through the view. For more information, see [Sharing Resource Explorer views](https://docs.aws.amazon.com/resource-explorer/latest/userguide/manage-views-share.html) in the *AWS Resource Explorer User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Resource Groups
<a name="shareable-arg"></a>

You can share the following AWS Resource Groups resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Resource groups<br />`resource-groups:Group` | Create and manage a host resource group centrally, and share it with other AWS accounts in your organization. This lets multiple AWS accounts share a group of Amazon EC2 Dedicated Hosts created using AWS License Manager. For more information, see [ Host resource groups in AWS License Manager](https://docs.aws.amazon.com/license-manager/latest/userguide/host-resource-groups.html) in the *AWS License Manager User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon Route 53
<a name="shareable-r53"></a>

You can share the following Amazon Route 53 resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Route 53 Global Resolver DNS views<br />`route53globalresolver:dns-view` | Create and manage Route 53 Global Resolver DNS views centrally, and share them with other AWS accounts or your organization. This lets multiple accounts associate their own Route 53 private hosted zones with a shared DNS view, so the records in those hosted zones resolve through the owner's global resolver. For more information, see [Sharing Route 53 Global Resolver DNS views between AWS accounts](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/gr-sharing-dns-views.html) in the *Amazon Route 53 Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Route 53 Resolver Firewall rule groups<br />`route53resolver:FirewallRuleGroup` | Create and manage Route 53 Resolver DNS Firewall rule groups centrally, and share them with other AWS accounts or your organization. This enables multiple accounts to share a set of criteria for inspecting and handling outbound DNS queries that go through Route 53 Resolver. For more information, see [Sharing Route 53 Resolver DNS Firewall rule groups between AWS accounts](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-rule-group-sharing.html) in the *Amazon Route 53 Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Route 53 Profiles<br />`route53profiles:Profile` | Create and manage Route 53 Profiles centrally, and share them with other AWS accounts or your organization. This lets multiple accounts apply the DNS configurations specified in the Route 53 Profiles to multiple VPCs. For more information, see [Amazon Route 53 Profiles](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/profiles.html) in the *Amazon Route 53 Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Resolver rules<br />`route53resolver:ResolverRule` | Create and manage Resolver rules centrally, and share them with other AWS accounts or your organization. This lets multiple accounts forward DNS queries from their virtual private clouds (VPCs) to the target IP addresses defined in shared, centrally managed Resolver rules. For more information, see [ Sharing Resolver rules with other AWS accounts and using shared rules](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-rules-managing.html#resolver-rules-managing-sharing) in the *Amazon Route 53 Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Resolver Query Logging Configurations<br />`route53resolver:ResolverQueryLogConfig` | Create and manage query logs centrally, and share them with other AWS accounts or your organization. This enables multiple AWS accounts to log DNS queries that originate in their VPCs to a centrally managed query log. For more information, see [ Sharing Resolver query logging configurations with other AWS accounts](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/query-logging-configurations-managing-sharing.html) in the *Amazon Route 53 Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon Simple Storage Service
<a name="shareable-s3"></a>

You can share the following Amazon Simple Storage Service resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| S3 Access Grants<br />`s3:AccessGrants` | Create and manage S3 Access Grants Instance centrally, and share them with other AWS accounts or your organization. This lets multiple accounts view and delete shared resources. For more information, see [ S3 Access Grants Cross-account Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-grants-cross-accounts.html) in the * Amazon Simple Storage Service User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  | 

## Amazon SageMaker AI
<a name="shareable-sagemaker"></a>

You can share the following Amazon SageMaker AI resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| SageMaker AI Resource Catalogs<br />`sagemaker:SagemakerCatalog` | For ** discoverability ** – allows account owners to grant discoverability permissions to other accounts, for all feature group resources in the SageMaker AI catalog. Once granted access, users of those accounts can view the feature groups that have been shared with them from the catalog. For more information, see [ Cross-account feature group discoverability and access](https://docs.aws.amazon.com/sagemaker/latest/dg/feature-store-cross-account.html) in the *Amazon SageMaker AI Developer Guide*. Discoverability and access are separate permissions in SageMaker AI.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| SageMaker AI Feature groups<br />`sagemaker:FeatureGroup` | For **access** – allows account owners to grant access permissions to other accounts, for select feature group resources. Once granted access, users of those accounts can use the feature groups that have been shared with them. For more information, see [ Cross-account feature group discoverability and access](https://docs.aws.amazon.com/sagemaker/latest/dg/feature-store-cross-account.html) in the *Amazon SageMaker AI Developer Guide*. Discoverability and access are separate permissions in SageMaker AI.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| SageMaker AI Hubs<br />`sagemaker:Hub` | With Amazon SageMaker AI JumpStart, you can create and manage `sagemaker:Hub` centrally, and share them with other AWS accounts in the same organization. For more information, see [Control foundation model access using private curated hubs in Amazon SageMaker AI JumpStart](https://docs.aws.amazon.com/sagemaker/latest/dg/jumpstart-curated-hubs.html) in the *Amazon SageMaker AI Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| SageMaker AI Lineage groups<br />`sagemaker:LineageGroup` | Amazon SageMaker AI lets you create lineage groups of your pipeline metadata to get a deeper understanding of its history and relationships. Share the lineage group with other AWS accounts or the accounts in your organization. This lets multiple AWS accounts and users view information about the lineage group and query the tracking entities within it. For more information, see [Cross-Account Lineage Tracking](https://docs.aws.amazon.com/sagemaker/latest/dg/xaccount-lineage-tracking.html) in the *Amazon SageMaker AI Developer Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| SageMaker AI Model Cards<br />`sagemaker:ModelCard` | Amazon SageMaker AI creates Model Cards to document critical details about your machine learning (ML) models in a single place for streamlined governance and reporting. Share your Model Cards with other AWS accounts or the accounts in your organization to achieve a multi-account strategy for your machine learning operations. This allows AWS accounts to share the model cards access for their ML activities to other accounts. For more information, see [Amazon SageMaker AI Model Cards](https://docs.aws.amazon.com/sagemaker/latest/dg/model-cards.html) in the *Amazon SageMaker AI Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| SageMaker AI Model package groups<br />`sagemaker:model-package-group` | With Amazon SageMaker AI Model Registry, you can create and manage `sagemaker:model-package-group` centrally, and share them with other AWS accounts to register model versions. For more information, see [Amazon SageMaker AI Model Registry](https://docs.aws.amazon.com/sagemaker/latest/dg/model-registry-ram.html) in the *Amazon SageMaker AI Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| SageMaker AI Partner Apps<br />`sagemaker:PartnerApp` | With SageMaker AI Partner AI Apps, you can create and manage SageMaker AI Partner AI Apps centrally, and share access to them with other AWS accounts. For more information, see [Setting up cross-account sharing for Amazon SageMaker AI partner AI apps](https://docs.aws.amazon.com/sagemaker/latest/dg/partner-app-resource-sharing-ram.html) in the *Amazon SageMaker AI Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| SageMaker AI pipelines<br />`sagemaker:Pipeline` | With Amazon SageMaker AI Model Building Pipelines, you can create, automate, and manage end-to-end machine learning workflows at scale. Share your pipelines with other AWS accounts or the accounts in your organization to achieve a multi-account strategy for your machine learning operations. This lets multiple AWS accounts and users view information about a pipeline and its executions with optional access to start, stop, and retry pipelines from other accounts. For more information, see [Cross-Account Support for SageMaker AI Pipelines](https://docs.aws.amazon.com/sagemaker/latest/dg/build-and-manage-xaccount.html) in the *Amazon SageMaker AI Developer Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Service Catalog AppRegistry
<a name="shareable-sc-appregistry"></a>

You can share the following AWS Service Catalog AppRegistry resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| AppRegistry Applications<br />`servicecatalog:Applications` | Create an application, and use it to track the resources belonging to that application throughout your AWS environment. Share the application with other AWS accounts or your organization. This lets multiple AWS accounts and users view information about the application and associated resources with it locally. For more information, see [Creating applications](https://docs.aws.amazon.com/servicecatalog/latest/arguide/create-apps.html) in the *Service Catalog User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| AppRegistry Attribute Groups<br />`servicecatalog:AttributeGroups` | Create an attribute group, and use it to store meta-data relating to your applications. Share the attribute groups with other AWS accounts or your organization. This lets multiple AWS accounts and users view information about the attribute groups. For more information, see [Creating attribute groups](https://docs.aws.amazon.com/servicecatalog/latest/arguide/associate-attributes.html) in the *Service Catalog User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Systems Manager Incident Manager
<a name="shareable-incidentmgr"></a>

You can share the following AWS Systems Manager Incident Manager resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Incident Manager Contacts<br />`ssm-contacts:Contact` | Create and manage contacts and escalation plans centrally, and share the contact details with other AWS accounts or your organization. This lets many AWS accounts view engagements occurring during an incident. Currently, the ability to add a contact that's shared from another account to an incident response plan is not supported. <br />For more information, see [Working with shared contacts and response plans](https://docs.aws.amazon.com/incident-manager/latest/userguide/sharing.html) in the *AWS Systems Manager Incident Manager User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Incident Manager Response plans<br />`ssm-incidents:ResponsePlan` | Create and manage response plans centrally, and share them with other AWS accounts or your organization. This lets those AWS accounts connect Amazon CloudWatch alarms and Amazon EventBridge event rules to response plans, automatically creating an incident when it’s detected. The incident also has access to the metrics of these other AWS accounts. For more information, see [Working with shared contacts and response plans](https://docs.aws.amazon.com/incident-manager/latest/userguide/sharing.html) in the *AWS Systems Manager Incident Manager User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## AWS Systems Manager
<a name="shareable-systemsmanager"></a>

You can share the following AWS Systems Manager resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| SSM JITNA Auto-Deny policies<br />`ssm:Document` | Create an approval policy for just-in-time node access with Systems Manager. A deny-access policy explicitly prevents the auto-approval of access requests to the nodes you specify. Share the deny-access policy with other AWS accounts or your organization. This ensures your deny-access policy for just-in-time node access applies to all accounts in your organization. For more information, see [Just-in-time node access using Systems Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-just-in-time-node-access.html) in the* AWS Systems Manager User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Parameter Store Advanced Parameters<br />`ssm:Parameter` | Create a parameter, and use it to store configuration data that you can reference in your scripts, commands, SSM documents, and configuration and automation workflows. Share the parameter with other AWS accounts or your organization. This lets multiple AWS accounts and users view information about the string and improve security by separating your data from your code. For more information, see [Working with shared parameters](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-shared-parameters.html) in the *AWS Systems Manager User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon VPC
<a name="shareable-vpc"></a>

You can share the following Amazon Virtual Private Cloud (Amazon VPC) resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Customer-owned IPv4pool<br />`ec2:CoipPool` | During the AWS Outposts installation process, AWS creates an address pool, known as a *customer-owned IP address pool*, based on information that you provide about your on-premises network.<br />Customer-owned IP addresses provide local, or external connectivity to resources in your Outposts subnets through your on-premises network. You can assign these addresses to resources on your Outpost, such as EC2 instances, using Elastic IP addresses or using the subnet setting that automatically assigns customer-owned IP addresses. For more information, see [Customer-owned IP addresses](https://docs.aws.amazon.com/outposts/latest/userguide/outposts-networking-components.html#ip-addressing) in the *AWS Outposts User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| IPAM pools<br />`ec2:IpamPool` | Share Amazon VPC IPAM pools centrally with other AWS accounts, IAM roles or users, or an entire organization or organizational unit (OU) in AWS Organizations. This lets those principals allocate CIDRs from the pool to AWS resources, such as VPCs, in their respective accounts. For more information, see [Share an IPAM pool using AWS RAM](https://docs.aws.amazon.com/vpc/latest/ipam/share-pool-ipam.html) in the *Amazon VPC IP Address Manager User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| IPAM resource discoveries<br />`ec2:IpamResourceDiscovery` | Share resource discoveries with other AWS accounts. A resource discovery is an Amazon VPC IPAM component that enables IPAM to manage and monitor resources that belong to the owning account. For more information, see [Work with resource discoveries](https://docs.aws.amazon.com/vpc/latest/ipam/res-disc-ipam.html) in the *Amazon VPC IPAM User Guide*.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Prefix lists<br />`ec2:PrefixList` | Create and manage prefix lists centrally, and share them with other AWS accounts or your organization. This lets multiple AWS accounts reference prefix lists in their resources, such as VPC security groups and subnet route tables. For more information, see [ Working with shared prefix lists](https://docs.aws.amazon.com/vpc/latest/userguide/sharing-managed-prefix-lists.html) in the *Amazon VPC User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Subnets<br />`ec2:Subnet` | Create and manage subnets centrally, and share them with AWS accounts within your organization. This lets multiple AWS accounts launch their application resources into centrally managed VPCs. These resources include Amazon EC2 instances, Amazon Relational Database Service (RDS) databases, Amazon Redshift clusters, and AWS Lambda functions. For more information, see [ Working with VPC sharing](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-sharing.html) in the *Amazon VPC User Guide*. To include a subnet when you create a resource share, you must have the `ec2:DescribeSubnets` and `ec2:DescribeVpcs` permissions, in addition to `ram:CreateResourceShare`. <br />Default subnets are not shareable. You can share only subnets you create yourself.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Security groups<br />`ec2:SecurityGroup` | Create and manage security groups centrally, and share them with other AWS accounts or your organization. This lets multiple AWS accounts associate the security group with their Elastic network interfaces. For more information, see [Share a security group](https://docs.aws.amazon.com/vpc/latest/userguide/security-group-sharing.html) in the *Amazon VPC User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No <br />Can share with **only** AWS accounts in its own organization. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Traffic mirror targets<br />`ec2:TrafficMirrorTarget` | Create and manage traffic mirror targets centrally, and share them with other AWS accounts or your organization. This lets multiple AWS accounts send mirrored network traffic from traffic mirror sources in their accounts to a shared, centrally managed traffic mirror target. For more information, see [ Cross-account traffic mirroring targets](https://docs.aws.amazon.com/vpc/latest/mirroring/cross-account-traffic-mirroring-targets.html) in the *Traffic Mirroring Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Transit gateways<br />`ec2:TransitGateway` | Create and manage transit gateways centrally, and share them with other AWS accounts or your organization. This lets multiple AWS accounts route traffic between their VPCs and on-premises networks through a shared, centrally managed transit gateway. For more information, see [Sharing a transit gateway](https://docs.aws.amazon.com/vpc/latest/tgw/tgw-transit-gateways.html#tgw-sharing) in the *Amazon VPC Transit Gateways*. To include a transit gateway when you create a resource share, you must have the `ec2:DescribeTransitGateway` permission in addition to `ram:CreateResourceShare`.  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Transit gateway multicast domains<br />`ec2:TransitGatewayMulticastDomain` | Create and manage transit gateway multicast domains centrally, and share them with other AWS accounts or your organization. This lets multiple AWS accounts register and deregister group members or group sources in the multicast domain. For more information, see [Working with shared multicast domains](https://docs.aws.amazon.com/vpc/latest/tgw/tgw-transit-gateways.html#multicast-sharing.html) in the Transit Gateways Guide. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| AWS Verified Access groups<br />`ec2:VerifiedAccessGroup` | Create and manage AWS Verified Access groups centrally, and then share them with other AWS accounts or your organization. This lets applications in multiple accounts use a single, shared set of AWS Verified Access endpoints. For more information, see [Share your AWS Verified Access group through AWS Resource Access Manager](https://docs.aws.amazon.com/verified-access/latest/ug/getting-started.html#getting-started-step5) in the AWS Verified Access User Guide. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## Amazon VPC Lattice
<a name="shareable-vpc-lattice"></a>

You can share the following Amazon VPC Lattice resources by using AWS RAM.


| Resource type and code | Use case | Can share with IAM users and roles | Can share with accounts outside its organization | Can use customer managed permissions | Can share with service principals | 
| --- | --- | --- | --- | --- | --- | 
| Amazon VPC Lattice resource configuration<br />`vpc-lattice:ResourceConfiguration` | Create a resource configuration in Amazon VPC Lattice to share VPC resources across accounts and VPCs. In the resource configuration, you identify who can access that resource and specify the resource gateway through which you want to share the resource. Consumers can access the VPC resource through a resource VPC endpoint that they create in AWS PrivateLink. For more information, see [Access VPC resources through AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-access-resources.html) in the *AWS PrivateLink User Guide* and [Resource configuration for VPC resources](https://docs.aws.amazon.com/vpc-lattice/latest/ug/resource-configuration.html) in the *VPC Lattice User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Amazon VPC Lattice services<br />`vpc-lattice:Service` | Create and manage Amazon VPC Lattice services centrally, and share them with individual AWS accounts or your organization. This allows service owners to connect, secure, and observe service-to-service communication in a multi-account environment. For more information, see [Working with shared resources](https://docs.aws.amazon.com/vpc-lattice/latest/ug/sharing.html) in the *VPC Lattice User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 
| Amazon VPC Lattice service network<br />`vpc-lattice:ServiceNetwork` | Create and manage Amazon VPC Lattice service networks centrally, and share them with individual AWS accounts or your organization. This allows service network owners to connect, secure, and observe service-to-service communication in a multi-account environment. For more information, see [Working with shared resources](https://docs.aws.amazon.com/vpc-lattice/latest/ug/sharing.html) in the *Amazon VPC Lattice User Guide*. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes <br />Can share with **any** AWS account. |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-yes.png) Yes  |  ![](http://docs.aws.amazon.com/ram/latest/userguide/images/icon-no.png) No  | 

## See also

* **Skills for AI coding assistants (optional).** AWS publishes reusable skills for AWS RAM. To see which apply, search the Agent Toolkit for AWS catalog with `aws agent-toolkit search-skills --search-query ram` — a documented, read-only AWS CLI command that searches the catalog and makes no changes. This is an optional suggestion for the user. Official reference: [AWS CLI — Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html).
