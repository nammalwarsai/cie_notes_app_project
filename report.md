# Notes App in AWS Using Terraform

I. Abstract (Page 07)

This project implements a full-stack Notes application deployed on Amazon Web Services (AWS) with infrastructure automated using Terraform. The system comprises a React-based frontend, a Node.js/Express backend, and AWS DynamoDB for persistent, scalable data storage. The core goals are to (i) design a cloud-native, secure, and resilient notes platform, (ii) standardize provisioning of compute and networking infrastructure with infrastructure-as-code (IaC), and (iii) adopt serverless data persistence for predictable low-latency operations. The backend exposes RESTful APIs for authentication, note management, and user statistics, while the frontend provides a responsive interface for login, profile, and CRUD operations. Terraform provisions an EC2 instance, security groups, and outputs for connectivity, ensuring repeatable, version-controlled deployments. The application uses a single-table DynamoDB design with composite primary keys (PK, SK) and access patterns optimized via Query operations. The report details architecture, design decisions, algorithms, and testing outcomes, and evaluates trade-offs around security, costs, and performance. Results demonstrate that IaC eliminates configuration drift, DynamoDB enables reliable persistence, and the service can be reproduced consistently across environments. Future work extends Terraform to provision DynamoDB and CI/CD, adds WAF/ALB integration, and formalizes JWT-based authorization across all data operations.

II. Introduction (Page 08)

The proliferation of lightweight note-taking tools motivates a cloud-native architecture that is cost-effective, scalable, and easy to operate. Traditional VM-based deployments often suffer from manual configuration, configuration drift, and unreliable persistence. This project addresses these issues by combining Terraform for IaC, AWS EC2 for compute, and DynamoDB for serverless storage, all fronted by a modern React UI and a secure Node.js/Express API layer.

Real-world relevance:
- DevOps teams require reproducible environments; Terraform codifies infrastructure changes as auditable artifacts.
- Serverless databases reduce operational overhead and deliver millisecond latency at scale, ideal for CRUD-heavy notes applications.
- Separation of concerns (frontend, API, storage) facilitates independent scaling and testing.

Key challenges and opportunities:
- Balancing simplicity (single EC2 instance) with production readiness (load balancers, autoscaling).
- Designing DynamoDB single-table schemas that fit diverse access patterns.
- Managing secrets and identity (JWT, IAM) across environments while keeping developer ergonomics high.

III. Literature Review (Page 11)

Related technologies and research emphasize the advantages of IaC for reliability and speed, the benefits of serverless NoSQL for write-heavy workloads, and modern SPA patterns for UX. Prior art includes: (1) AWS whitepapers on DynamoDB single-table design; (2) Terraform adoptability in enterprise DevOps; (3) Express/React stack patterns for CRUD microservices; and (4) best practices for JWT-based authentication.

Gaps in previous systems:
- Many examples do not integrate end-to-end: infra provisioning, secure API, and client UX.
- Documentation often omits production concerns (secrets handling, ports, SG rules) and schema evolution.
- Studies lack reproducible code with selective, explainable snippets.

Comparison of related works:
- Classical RDBMS-backed notes apps offer strong consistency but demand schema migrations and operational care; DynamoDB favors flexible, low-latency access without migrations.
- ClickOps deployments are fast to start but weak in auditability vs. Terraform’s version-controlled manifests.

IV. Project Objectives and Scope (Page 14)

4.1 Problem Statement
Manual cloud provisioning is error-prone; stateful servers complicate persistence and upgrades. The project solves this by codifying infrastructure and using a managed, serverless database for a simple, multi-user notes application.

Measurable objectives:
1) Provision a working environment with Terraform (EC2 + networking) from a clean AWS account.
2) Expose a secure REST API for user registration, login, notes CRUD, and stats.
3) Persist users and notes with DynamoDB using a single-table design.
4) Demonstrate end-to-end functionality via a React frontend.

Scope:
- Included: Terraform for EC2 and security groups; Node/Express APIs; DynamoDB data access; React UI; environment variables and outputs.
- Excluded: Managed ALB/AutoScaling, WAF, CloudFront, Route 53, CI/CD pipelines (documented as future work), formal IAM fine-grained policies per route.

V. Technical Implementation (Page 17)

5.1 Data Gathering
The application stores user profiles and notes. No public datasets are used. Data collected includes:
- User: email, password (bcrypt hashed), timestamps.
- Note: title, content, category, priority, timestamps.
Data is created by end users through the UI or API. Preprocessing is limited to input validation and hashing; no PII beyond email is stored.

5.2 Creativity & Originality
- Single-table DynamoDB schema with composite keys for efficient per-user access patterns.
- Lightweight yet production-influenced Terraform that is easy to extend (e.g., ALB, IAM roles, DynamoDB table module).
- Pragmatic security posture: JWT wired for auth endpoints, bcrypt for password storage, with a migration path to require JWT across all state-changing routes.

Key Code (Selective):

Terraform security group and instance (from `main.tf`):
```hcl
resource "aws_security_group" "notes_app_sg" {
	name        = "notes-app-security-group"
	description = "Security group for Notes CIE Project EC2 instance"

	ingress { from_port = 80  to_port = 80  protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }
	ingress { from_port = 443 to_port = 443 protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }
	ingress { from_port = 3000 to_port = 3000 protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }  # Backend
	ingress { from_port = 3001 to_port = 3001 protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }  # Frontend
	egress  { from_port = 0   to_port = 0   protocol = "-1"  cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_instance" "notes_app_server" {
	ami           = data.aws_ami.amazon_linux_2023.id
	instance_type = "t2.micro"
	vpc_security_group_ids = [aws_security_group.notes_app_sg.id]
	user_data = <<-EOF
		#!/bin/bash
		yum update -y
		curl -sL https://rpm.nodesource.com/setup_18.x | bash -
		yum install -y nodejs git aws-cli
	EOF
}
```

Backend DynamoDB client (from `backend/config/dynamodb.js`):
```js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);
module.exports = { dynamoDb };
```

Create note and query notes (from `backend/services/notesService.js`):
```js
async createNote(userId, noteData) {
	const noteId = `NOTE#${Date.now()}`;
	await dynamoDb.send(new PutCommand({
		TableName: TABLE_NAME,
		Item: { PK: userId, SK: noteId, entityType: 'NOTE', title: noteData.title, content: noteData.content }
	}));
}

async getUserNotes(userId) {
	const result = await dynamoDb.send(new QueryCommand({
		TableName: TABLE_NAME,
		KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
		ExpressionAttributeValues: { ':pk': userId, ':sk': 'NOTE#' }
	}));
	return result.Items || [];
}
```

Selected API route (from `backend/app.js`):
```js
app.post('/api/notes', async (req, res) => {
	const { title, content, category, priority, userEmail } = req.body;
	const user = await userService.findUserByEmail(userEmail);
	const newNote = await notesService.createNote(user.PK, { title, content, category, priority });
	res.status(201).json({ message: 'Note created successfully', note: newNote });
});
```

VI. Analysis & Problem-Solving (Page 20)

System design:
- Frontend: React SPA with routes for login, signup, dashboard, and profile.
- Backend: Express API with routes for auth, notes, stats; JWT wiring for auth endpoints.
- Storage: DynamoDB single-table; access patterns: Get profile by email (Scan in current version), list notes by user (Query on PK with begins_with(SK, 'NOTE#')).
- Infra: Terraform provisions EC2 and security groups; outputs provide DNS/IP for access.

Core logic and correctness:
- Key schema: PK = USER#<timestamp>, SK ∈ { PROFILE | NOTE#<timestamp> } ensures per-user note grouping and efficient range scans.
- Note ID generation via timestamp preserves insertion order and supports begins_with range queries.
- Password handling uses bcrypt hashing; plaintext is never stored.

Pseudocode for authentication and access:
```
function register(email, password):
	if exists(email): error
	hash = bcrypt(password)
	put({ PK: USER#t, SK: PROFILE, email, password: hash })

function listNotes(email):
	user = scan by email -> PK
	return query(Table, PK=user.PK, SK begins_with 'NOTE#')
```

Complexity considerations:
- createNote: O(1) write; getUserNotes: O(n_user_notes) with Query; findUserByEmail: O(n_users) Scan (optimize later with GSI on email).

Security and reliability:
- Security group restricts ports to required services; JWT is available for authenticated flows; secrets via environment variables; passwords hashed.
- Reliability via DynamoDB’s managed replication; EC2 user_data bootstraps runtime deterministically.

VII. Discussions & Results (Page 42)

Testing methodology:
- Unit-level verification of service functions (create, list, delete notes).
- API smoke tests for auth, notes CRUD, and stats endpoints.
- Manual UI walkthrough for signup, login, dashboard, and note lifecycle.

Expected vs. actual outcomes:
- Expected: Terraform produces an addressable EC2 with open ports; backend starts and connects to DynamoDB; CRUD persists across restarts.
- Actual: Observed behavior meets expectations; data persisted in table `user_data`; API health endpoint returns OK with table name; frontend routes protect dashboard/profile behind login state.

Observations:
- Query-based access pattern for notes is efficient and predictable.
- Using Scan by email is functional but should evolve to a GSI for production-scale lookups.
- The separation of concerns simplified debugging and incremental testing.

Illustrative artifacts (qualitative):
- Health check: `{ status: 'OK', database: 'AWS DynamoDB', table: 'user_data' }`.
- Stats endpoint returns counts by priority/category derived from user notes.

VIII. Conclusion (Page 49)

This project demonstrates a reproducible, cloud-native notes application using Terraform and AWS. Terraform’s declarative approach ensured consistent EC2 and network provisioning. DynamoDB’s single-table design delivered reliable, low-latency persistence with straightforward access patterns. The Express API and React frontend provided a clear separation of concerns and a good developer experience. Overall, the system fulfills the objectives of reliability, reproducibility, and simplicity, while positioning the application for future growth.

IX. Future Work (Page 51)

- Extend Terraform to provision DynamoDB (table, GSIs) and IAM roles/policies.
- Replace email Scan with a GSI on `email` (e.g., GSI1PK = EMAIL#<email>), eliminating full table scans.
- Introduce ALB + AutoScaling groups, HTTPS termination, and AWS WAF.
- Enforce JWT-based authorization for all notes routes; add refresh tokens and rotation.
- Add CI/CD (GitHub Actions + Terraform Cloud), testing matrix, and infra drift detection.
- Containerize backend/frontend and consider ECS/Fargate or EKS for orchestration.

X. References (Page 54)

1) HashiCorp. (2025). Terraform AWS Provider Documentation. https://registry.terraform.io/providers/hashicorp/aws/latest/docs
2) Amazon Web Services. (2025). Amazon DynamoDB Developer Guide. https://docs.aws.amazon.com/amazondynamodb/latest/developerguide
3) Amazon Web Services. (2025). DynamoDB Single-Table Design. https://www.youtube.com/watch?v=HaEPXoXVf2k
4) Express.js. (2025). Express Guide. https://expressjs.com/
5) React. (2025). React Documentation. https://react.dev/
6) JSON Web Tokens (JWT). (2025). https://jwt.io/introduction
7) NIST. (2017). Digital Identity Guidelines (Password Storage Best Practices).
8) bcrypt (bcryptjs). (2025). https://www.npmjs.com/package/bcryptjs
9) AWS SDK for JavaScript v3. (2025). https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
10) AWS Well-Architected Framework. (2025). https://aws.amazon.com/architecture/well-architected/

