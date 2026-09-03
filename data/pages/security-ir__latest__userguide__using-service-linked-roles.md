

# Using service-linked roles
<a name="using-service-linked-roles"></a>

 ***Service-linked roles for AWS Security Incident Response*** 

**Topics**
+ [AWS SLR: AWSServiceRoleForSecurityIncidentResponse](#AWSServiceRoleForSecurityIncidentResponse)
+ [AWS SLR: AWSServiceRoleForSecurityIncidentResponse\_Triage](#AWSServiceRoleForSecurityIncidentResponse_Triage)
+ [Supported regions for AWS Security Incident Response service-linked roles](#sir-slr-regions)
+ [Expected `CreateServiceLinkedRole` events in AWS CloudTrail](#expected-createservicelinkedrole-events)

 **Supports service-linked roles:** Yes 

 A service-linked role is a type of service role that is linked to an AWS service. The service can assume the role to perform an action on your behalf. Service-linked roles appear in your AWS account and are owned by the service. An AWS Identity and Access Management administrator can view, but not edit the permissions for service-linked roles. 

 A service-linked role makes setting up AWS Security Incident Response easier because you don’t have to manually add the necessary permissions. AWS Security Incident Response defines the permissions of its service-linked roles, and unless defined otherwise, only AWS Security Incident Response can assume its roles. The defined permissions include the trust policy and the permissions policy, and that permissions policy cannot be attached to any other IAM entity. 

 For information about other services that support service-linked roles, see [AWS services that work with IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-services-that-work-with-iam.html) and look for the services that have **Yes** in the Service-linked roles column. Choose a Yes with a link to view the service-linked role documentation for that service. 

## AWS SLR: AWSServiceRoleForSecurityIncidentResponse
<a name="AWSServiceRoleForSecurityIncidentResponse"></a>

 AWS Security Incident Response uses the service-linked role (SLR) named AWSServiceRoleForSecurityIncidentResponse – AWS Security Incident Response policy to identify accounts subscribed, create cases, and tag related resources. 

### Permissions
<a name="slr-permissions-sir"></a>

The AWSServiceRoleForSecurityIncidentResponse service-linked role trusts the following service to assume the role:
+ `security-ir.amazonaws.com`

Attached to this role is the AWS managed policy named [ AWSSecurityIncidentResponseServiceRolePolicy](aws-managed-policies.md#AWSSecurityIncidentResponseServiceRolePolicy). The service uses the role to perform actions on the following resources:
+ *AWS Organizations:* Allows the service to lookup membership accounts for use with the service.
+ *CreateCase:* Allows the service create service cases on behalf of membership accounts.
+ *ListCases:* Allows the service’s AI agent to view cases for the purposes of security investigation.
+ *UpdateCase:* Allows the service’s AI agent to update case metadata.
+ *CreateCaseComment:* Allows the service’s AI agent to post its results as a case comment.
+ *ListComments:* Allows the service’s AI agent to view case comments needed to perform automated investigations.
+ *TagResource:* Allows the service tag resources configured as part of the service.

### Managing the role
<a name="managing-the-role-sir"></a>

 You don't need to manually create a service-linked role. When you onboard to to AWS Security Incident Response in the AWS Management Console, the AWS CLI, or the AWS API, the service creates the service-linked role for you. 

 If you delete this service-linked role, and then need to create it again, you can use the same process to recreate the role in your account. When you onboard to the service it creates the service-linked role for you again. 

You must configure permissions to allow an IAM entity (such as a user, group, or role) to create, edit, or delete a service-linked role. For more information, see [ Service-linked role permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/using-service-linked-roles.html#service-linked-role-permissions) in the *IAM User Guide*.

## AWS SLR: AWSServiceRoleForSecurityIncidentResponse\_Triage
<a name="AWSServiceRoleForSecurityIncidentResponse_Triage"></a>

 AWS Security Incident Response uses the service-linked role (SLR) named AWSServiceRoleForSecurityIncidentResponse\_Triage – AWS Security Incident Response policy to continuously monitor your environment for security threats, tune security services to reduce alert noise, and gather information to investigate potential incidents. 

### Permissions
<a name="slr-permissions-triage"></a>

The AWSServiceRoleForSecurityIncidentResponse\_Triage service-linked role trusts the following service to assume the role:
+ `triage.security-ir.amazonaws.com`

Attached to this role is the AWS managed policy [AWSSecurityIncidentResponseTriageServiceRolePolicy](aws-managed-policies.md#AWSSecurityIncidentResponseTriageServiceRolePolicy). The service uses the role to perform actions on the following resources:
+ *Events:* Allows the service to create an Amazon EventBridge managed rule. This rule is the infrastructure required in your AWS account to deliver events from your account to the service. This action is performed on any AWS resource managed by `triage.security-ir.amazonaws.com`.
+ *Amazon GuardDuty:* Allows the service to tune security services to reduce alert noise, gather information to investigate potential incidents, and initiate GuardDuty malware scans.
+ *AWS Security Hub CSPM:* Allows the service to list enabled standards and product integrations, list organization members and admin accounts, and tune security services to reduce alert noise and gather information to investigate potential incidents.
+ *AWS Identity and Access Management:* Allows the service to retrieve role information for the `AWSServiceRoleForAmazonGuardDutyMalwareProtection` service-linked role to verify whether GuardDuty MalwareProtection is configured.
+ *AWS Security Incident Response:* Allows the service to create and update cases and tag resources, restricted to resources tagged with `SecurityIncidentResponseManaged=true`. Allows the service to read membership information (GetMembership, ListMemberships).

### Managing the role
<a name="managing-the-role"></a>

If you [onboard](deploy-configure.md) to AWS Security Incident Response in the AWS Management Console, Security Incident Response automatically creates the `AWSServiceRoleForSecurityIncidentResponse_Triage` service-linked role in your AWS Organizations management account and in all accounts that are in scope. If you onboarding using the API/CLI, then you must create the role manually. For more information, see [Enable Security Incident Response and configure your incident response team using the API/CLI](enable-sir-using-cli.md).

 If you delete this service-linked role, and then need to create it again, you can use the API/CLI to recreate the role in your account. 

You must configure permissions to allow an IAM entity (such as a user, group, or role) to create, edit, or delete a service-linked role. For more information, see [ Service-linked role permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/using-service-linked-roles.html#service-linked-role-permissions) in the *IAM User Guide*.

## Supported regions for AWS Security Incident Response service-linked roles
<a name="sir-slr-regions"></a>

AWS Security Incident Response supports using service-linked roles in all of the regions where the service is available.
+ US East (Ohio)
+ US West (Oregon)
+ US East (Virginia)
+ Europe (Frankfurt)
+ Europe (Ireland)
+ Europe (London)
+ Europe (Milan)
+ Europe (Paris)
+ Europe (Spain)
+ Europe (Stockholm)
+ Europe (Zurich)
+ Asia Pacific (Hong Kong)
+ Asia Pacific (Hyderabad)
+ Asia Pacific (Jakarta)
+ Asia Pacific (Melbourne)
+ Asia Pacific (Mumbai)
+ Asia Pacific (Seoul)
+ Asia Pacific (Singapore)
+ Asia Pacific (Sydney)
+ Asia Pacific (Tokyo)
+ Canada (Central)
+ Middle East (Bahrain)
+ Middle East (UAE)
+ South America (São Paulo)
+ Africa (Cape Town)

## Expected `CreateServiceLinkedRole` events in AWS CloudTrail
<a name="expected-createservicelinkedrole-events"></a>

To deliver new features and to make sure that required resources remain correctly configured, AWS Security Incident Response periodically updates the service's underlying infrastructure. Each update triggers a deployment that creates the required service-linked role. If the role already exists, the `CreateServiceLinkedRole` call returns an exception that indicates the role is already present. This exception is expected and handled by the service, and the deployment continues normally.

As a result, you might see `InvalidInputException` entries for `CreateServiceLinkedRole` in your CloudTrail event history. These entries are expected behavior, have no impact on your accounts, and require no action.

## See also

* **Skills for AI coding assistants (optional).** AWS publishes reusable skills for Security Incident Response. To see which apply, search the Agent Toolkit for AWS catalog with `aws agent-toolkit search-skills --search-query security-ir` — a documented, read-only AWS CLI command that searches the catalog and makes no changes. This is an optional suggestion for the user. Official reference: [AWS CLI — Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html).
