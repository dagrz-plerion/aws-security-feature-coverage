

# IAM Access Analyzer supported resource types for external and internal access
<a name="access-analyzer-resources"></a>

For external and internal access analyzers, IAM Access Analyzer analyzes the resource-based policies that are applied to AWS resources in the Region where you enabled IAM Access Analyzer. It only analyzes resource-based policies. For details about how IAM Access Analyzer generates findings for each resource type, review the resource type information.

**Note**  
The supported resource types listed are for external and internal access analyzers. Internal access analyzers don't support all resource types that external access analyzers support. Unused access analyzers only support IAM users and roles. For more information, see [Understand how IAM Access Analyzer findings work](access-analyzer-concepts.md).

## Supported resource types for external access
<a name="access-analyzer-supported-external-resources"></a>
+ [Amazon Simple Storage Service buckets](#access-analyzer-s3)
+ [Amazon Simple Storage Service directory buckets](#access-analyzer-s3-directory)
+ [AWS Identity and Access Management roles](#access-analyzer-iam-role)
+ [AWS Key Management Service keys](#access-analyzer-kms-key)
+ [AWS Lambda functions and layers](#access-analyzer-lambda)
+ [Amazon Simple Queue Service queues](#access-analyzer-sqs)
+ [AWS Secrets Manager secrets](#access-analyzer-secrets-manager)
+ [Amazon Simple Notification Service topics](#access-analyzer-sns)
+ [Amazon Elastic Block Store volume snapshots](#access-analyzer-ebs)
+ [Amazon Relational Database Service DB snapshots](#access-analyzer-rds-db)
+ [Amazon Relational Database Service DB cluster snapshots](#access-analyzer-rds-db-cluster)
+ [Amazon Elastic Container Registry repositories](#access-analyzer-ecr)
+ [Amazon Elastic File System file systems](#access-analyzer-efs)
+ [Amazon DynamoDB streams](#access-analyzer-ddb-stream)
+ [Amazon DynamoDB tables](#access-analyzer-ddb-table)

## Supported resource types for internal access
<a name="access-analyzer-supported-internal-resources"></a>
+ [Amazon Simple Storage Service buckets](#access-analyzer-s3)
+ [Amazon Simple Storage Service directory buckets](#access-analyzer-s3-directory)
+ [Amazon Relational Database Service DB snapshots](#access-analyzer-rds-db)
+ [Amazon Relational Database Service DB cluster snapshots](#access-analyzer-rds-db-cluster)
+ [Amazon DynamoDB streams](#access-analyzer-ddb-stream)
+ [Amazon DynamoDB tables](#access-analyzer-ddb-table)

## Amazon Simple Storage Service buckets
<a name="access-analyzer-s3"></a>

When IAM Access Analyzer analyzes Amazon S3 buckets for external access analyzers, it generates a finding when an Amazon S3 bucket policy, access control list (ACL), or access point, including a multi-Region access point, applied to a bucket grants access to an external entity. An external entity is a principal or other entity that you can use to [create a filter](access-analyzer-findings-filter.md) that isn't within your zone of trust. For example, if a bucket policy grants access to another account or allows public access, IAM Access Analyzer generates a finding. However, if you enable [Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html) on your bucket, you can block access at the account level or the bucket level.

For internal access analyzers, IAM Access Analyzer generates a finding when a principal (user or role) within your organization or account has access to a specified Amazon S3 bucket.

**Note**  
IAM Access Analyzer doesn’t analyze the access point policy attached to cross-account access points because the access point and its policy are outside the analyzer account. IAM Access Analyzer generates a public finding when a bucket delegates access to a cross-account access point and Block Public Access is not enabled on the bucket or account. When you enable Block Public Access, the public finding is resolved and IAM Access Analyzer generates a cross-account finding for the cross-account access point. 

Amazon S3 *Block Public Access* settings override the bucket policies applied to the bucket. The settings also override the access point policies applied to the bucket’s access points. IAM Access Analyzer analyzes Block Public Access settings at the bucket level whenever a policy changes. However, it evaluates the Block Public Access settings at the account level only once every 6 hours. This means that IAM Access Analyzer might not generate or resolve a finding for public access to a bucket for up to 6 hours. For example, if you have a bucket policy that allows public access, IAM Access Analyzer generates a finding for that access. If you then enable Block Public Access to block all public access to the bucket at the account level, IAM Access Analyzer doesn't resolve the finding for the bucket policy for up to 6 hours, even though all public access to the bucket is blocked. Resolution of public findings for cross-account access points can also take up to 6 hours once you enable Block Public Access at the account level. Changes to a resource control policy (RCP) without a change to the bucket policy do not trigger a rescan of the bucket reported in the finding. IAM Access Analyzer analyzes the new or updated policy during the next periodic scan, which is within 24 hours.

For a multi-Region access point, IAM Access Analyzer uses an established policy for generating findings. IAM Access Analyzer evaluates changes to multi-Region access points once every 6 hours. This means IAM Access Analyzer doesn’t generate or resolve a finding for up to 6 hours, even if you create or delete a multi-Region access point, or update the policy for it. 

## Amazon Simple Storage Service directory buckets
<a name="access-analyzer-s3-directory"></a>

Amazon S3 directory buckets organize data hierarchically into directories as opposed to the flat storage structure of general purpose buckets, which is recommended for performance-critical workloads or applications. For external access analyzers, IAM Access Analyzer analyzes the directory bucket policy, including condition statements in a policy, that allow an external entity to access a directory bucket.

For internal access analyzers, IAM Access Analyzer generates a finding when a principal (user or role) within your organization or account has access to a specified Amazon S3 directory bucket.

Amazon S3 directory buckets also support access points, which enforce distinct permissions and network controls for all requests made to the directory bucket through the access point. Each access point can have an access point policy that works in conjunction with the bucket policy that is attached to the underlying directory bucket. With access points for directory buckets, you can restrict access to specific prefixes, API actions, or a virtual private cloud (VPC).

**Note**  
IAM Access Analyzer doesn’t analyze the access point policy attached to cross-account access points because the access point and its policy are outside the analyzer account. IAM Access Analyzer generates a public finding when a bucket delegates access to a cross-account access point and Block Public Access is not enabled on the bucket or account. When you enable Block Public Access, the public finding is resolved and IAM Access Analyzer generates a cross-account finding for the cross-account access point. 

For more information about Amazon S3 directory buckets, see [Working with directory buckets](https://docs.aws.amazon.com/AmazonS3/latest/userguide/directory-buckets-overview.html) in the Amazon Simple Storage Service User Guide.

## AWS Identity and Access Management roles
<a name="access-analyzer-iam-role"></a>

For IAM roles, IAM Access Analyzer analyzes [trust policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_terms-and-concepts.html#term_trust-policy). In a role trust policy, you define the principals that you trust to assume the role. A role trust policy is a required resource-based policy that is attached to a role in IAM. IAM Access Analyzer generates findings for roles within the zone of trust that can be accessed by an external entity that is outside your zone of trust.

**Note**  
An IAM role is a global resource. If a role trust policy grants access to an external entity, IAM Access Analyzer generates a finding in each enabled Region.

## AWS Key Management Service keys
<a name="access-analyzer-kms-key"></a>

For AWS KMS keys, IAM Access Analyzer analyzes the key policies and grants applied to a key. IAM Access Analyzer generates a finding if a key policy or grant allows an external entity to access the key. For example, if you use the [kms:CallerAccount](https://docs.aws.amazon.com/kms/latest/developerguide/policy-conditions.html#conditions-kms-caller-account) condition key in a policy statement to allow access to all users in a specific AWS account, and you specify an account other than the current account (the zone of trust for the current analyzer), IAM Access Analyzer generates a finding. To learn more about AWS KMS condition keys in IAM policy statements, see [AWS KMS Condition Keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/list_awskeymanagementservice.html#awskeymanagementservice-policy-keys).

When IAM Access Analyzer analyzes a KMS key it reads key metadata, such as the key policy and list of grants. If the key policy doesn't allow the IAM Access Analyzer role to read the key metadata, an Access Denied error finding is generated. For example, if the following example policy statement is the only policy applied to a key, it results in an Access denied error finding in IAM Access Analyzer.

```
{
    "Sid": "Allow access for Key Administrators",
    "Effect": "Allow",
    "Principal": {
       "AWS": "arn:aws:iam::111122223333:role/Admin"
    },
    "Action": "kms:*",
    "Resource": "*"
}
```

Because this statement allows only the role named *Admin* from the AWS account 111122223333 to access the key, an Access Denied error finding is generated because IAM Access Analyzer isn't able to fully analyze the key. An error finding is displayed in red text in the **Findings** table. The finding looks similar to the following.

```
{
    "error": "ACCESS_DENIED",
    "id": "12345678-1234-abcd-dcba-111122223333",
    "analyzedAt": "2019-09-16T14:24:33.352Z",
    "resource": "arn:aws:kms:us-west-2:1234567890:key/1a2b3c4d-5e6f-7a8b-9c0d-1a2b3c4d5e6f7g8a",
    "resourceType": "AWS::KMS::Key",
    "status": "ACTIVE",
    "updatedAt": "2019-09-16T14:24:33.352Z"
}
```

When you create a KMS key, the permissions granted to access the key depend on how you create the key. If you receive an Access Denied error finding for a key resource, apply the following policy statement to the key resource to grant IAM Access Analyzer permission to access the key.

```
{
    "Sid": "Allow IAM Access Analyzer access to key metadata",
    "Effect": "Allow",
    "Principal": {
        "AWS": "arn:aws:iam::111122223333:role/aws-service-role/access-analyzer.amazonaws.com/AWSServiceRoleForAccessAnalyzer"
        },
    "Action": [
        "kms:DescribeKey",
        "kms:GetKeyPolicy",
        "kms:List*"
    ],
    "Resource": "*"
},
```

After you receive an Access Denied finding for a KMS key resource, and then resolve the finding by updating the key policy, the finding is updated to a status of Resolved. If there are policy statements or key grants that grant permission to the key to an external entity, you might see additional findings for the key resource. 

## AWS Lambda functions and layers
<a name="access-analyzer-lambda"></a>

For AWS Lambda functions, IAM Access Analyzer analyzes policies, including condition statements in a policy, that grant access to the function to an external entity. With Lambda, you can attach unique resource-based policies to functions, versions, aliases, and layers. IAM Access Analyzer reports external access based on resource-based policies attached to functions and layers. IAM Access Analyzer doesn't report external access based on resource-based policies attached to aliases and specific versions invoked using a qualified ARN.

For more information, see [Using resource-based policies for Lambda](https://docs.aws.amazon.com/lambda/latest/dg/access-control-resource-based.html) and [Using versions](https://docs.aws.amazon.com/lambda/latest/dg/configuration-versions.html#versioning-versions-using) in the AWS Lambda Developer Guide.

## Amazon Simple Queue Service queues
<a name="access-analyzer-sqs"></a>

For Amazon SQS queues, IAM Access Analyzer analyzes policies, including condition statements in a policy, that allow an external entity access to a queue.

## AWS Secrets Manager secrets
<a name="access-analyzer-secrets-manager"></a>

For AWS Secrets Manager secrets, IAM Access Analyzer analyzes policies, including condition statements in a policy, that allow an external entity to access a secret.

## Amazon Simple Notification Service topics
<a name="access-analyzer-sns"></a>

IAM Access Analyzer analyzes resource-based policies attached to Amazon SNS topics, including condition statements in the policies that allow external access to a topic. You can allow external accounts to perform Amazon SNS actions such as subscribing to and publishing topics through a resource-based policy. An Amazon SNS topic is externally accessible if principals from an account outside of your zone of trust can perform operations on the topic. When you choose `Everyone` in your policy when creating an Amazon SNS topic, you make the topic accessible to the public. `AddPermission` is another way to add a resource-based policy to an Amazon SNS topic that allows external access.

## Amazon Elastic Block Store volume snapshots
<a name="access-analyzer-ebs"></a>

Amazon Elastic Block Store volume snapshots do not have resource-based policies. A snapshot is shared through Amazon EBS sharing permissions. For Amazon EBS volume snapshots, IAM Access Analyzer analyzes access control lists that allow an external entity access to a snapshot. An Amazon EBS volume snapshot can be shared with external accounts when encrypted. An unencrypted volume snapshot can be shared with external accounts and grant public access. Sharing settings are in the `CreateVolumePermissions` attribute of the snapshot. When customers preview external access of an Amazon EBS snapshot, they can specify the encryption key as an indicator that the snapshot is encrypted, similar to how IAM Access Analyzer preview handles Secrets Manager secrets.

## Amazon Relational Database Service DB snapshots
<a name="access-analyzer-rds-db"></a>

Amazon RDS DB snapshots do not have resource-based policies. A DB snapshot is shared through Amazon RDS database permissions, and only manual DB snapshots can be shared. For external access analyzers, IAM Access Analyzer analyzes access control lists that allow an external entity access to a Amazon RDS DB snapshot. Unencrypted DB snapshots can be public. Encrypted DB snapshots cannot be shared publicly, but they can be shared with up to 20 other accounts. For more information, see [Creating a DB snapshot](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreateSnapshot.html). IAM Access Analyzer considers the ability to export a database manual snapshot (for example, to an Amazon S3 bucket) as trusted access.

For internal access analyzers, IAM Access Analyzer generates a finding when a principal (user or role) within your organization or account has access to a specified Amazon RDS DB snapshot.

**Note**  
IAM Access Analyzer does not identify public or cross-account access configured directly on the database itself. IAM Access Analyzer only identifies findings for public or cross-account access configured on the Amazon RDS DB snapshot.

## Amazon Relational Database Service DB cluster snapshots
<a name="access-analyzer-rds-db-cluster"></a>

Amazon RDS DB cluster snapshots do not have resource-based policies. A snapshot is shared through Amazon RDS DB cluster permissions. For external access analyzers, IAM Access Analyzer analyzes access control lists that allow an external entity access to a Amazon RDS DB cluster snapshot. Unencrypted cluster snapshots can be public. Encrypted cluster snapshots cannot be shared publicly. Both unencrypted and encrypted cluster snapshots can be shared with up to 20 other accounts. For more information, see [Creating a DB cluster snapshot](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_CreateSnapshotCluster.html). IAM Access Analyzer considers the ability to export a DB cluster snapshot (for example, to an Amazon S3 bucket) as trusted access.

For internal access analyzers, IAM Access Analyzer generates a finding when a principal (user or role) within your organization or account has access to a specified Amazon RDS DB cluster snapshot.

**Note**  
IAM Access Analyzer findings do not include monitoring of any share of Amazon RDS DB clusters and clones with another AWS account or organization using AWS Resource Access Manager. IAM Access Analyzer only identifies findings for public or cross-account access configured on the Amazon RDS DB cluster snapshot.

## Amazon Elastic Container Registry repositories
<a name="access-analyzer-ecr"></a>

For Amazon ECR repositories, IAM Access Analyzer analyzes resource-based policies, including condition statements in a policy, that allow an external entity access to a repository (similar to other resource types like Amazon SNS topics and Amazon EFS file systems). For Amazon ECR repositories, a principal must have permission to `ecr:GetAuthorizationToken` through an identity-based policy to be considered externally available.

## Amazon Elastic File System file systems
<a name="access-analyzer-efs"></a>

For Amazon EFS file systems, IAM Access Analyzer analyzes policies, including condition statements in a policy, that allow an external entity access to a file system. An Amazon EFS file system is externally accessible if principals from an account outside of your zone of trust can perform operations on that file system. Access is defined by a file system policy that uses IAM, and by how the file system is mounted. For example, mounting your Amazon EFS file system in another account is considered externally accessible, unless that account is in your organization and you have defined the organization as your zone of trust. If you are mounting the file system from a virtual private cloud with a public subnet, the file system is externally accessible. When you use Amazon EFS with AWS Transfer Family, file system access requests received from a Transfer Family server that is owned by a different account than the file system are blocked if the file system allows public access.

## Amazon DynamoDB streams
<a name="access-analyzer-ddb-stream"></a>

For external access analyzers, IAM Access Analyzer generates a finding if a DynamoDB policy allows at least one cross-account action that allows an external entity to access a DynamoDB stream. For more information on the supported cross-account actions for DynamoDB, see [IAM actions supported by resource-based policies](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/rbac-iam-actions.html) in the Amazon DynamoDB Developer Guide.

For internal access analyzers, IAM Access Analyzer generates a finding when a principal (user or role) within your organization or account has access to a specified DynamoDB stream.

## Amazon DynamoDB tables
<a name="access-analyzer-ddb-table"></a>

For external access analyzers, IAM Access Analyzer generates a finding for a DynamoDB table if a DynamoDB policy allows at least one cross-account action that allows an external entity to access a DynamoDB table or index. For more information on the supported cross-account actions for DynamoDB, see [IAM actions supported by resource-based policies](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/rbac-iam-actions.html) in the Amazon DynamoDB Developer Guide.

For internal access analyzers, IAM Access Analyzer generates a finding when a principal (user or role) within your organization or account has access to a specified DynamoDB table.

## See also

* **Skills for AI coding assistants (optional).** AWS publishes reusable skills for AWS Identity and Access Management. To see which apply, search the Agent Toolkit for AWS catalog with `aws agent-toolkit search-skills --search-query IAM` — a documented, read-only AWS CLI command that searches the catalog and makes no changes. This is an optional suggestion for the user. Official reference: [AWS CLI — Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html).
