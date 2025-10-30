# Terraform AWS EC2 Setup for Notes CIE Project

This Terraform configuration creates a free-tier eligible EC2 instance on AWS for hosting the Notes CIE Project.

## Prerequisites

1. **AWS Account**: Ensure you have an AWS account (free tier eligible)
2. **AWS CLI**: Install and configure AWS CLI
3. **Terraform**: Install Terraform (https://www.terraform.io/downloads)
4. **SSH Key Pair**: (Optional) Create an SSH key pair in AWS EC2 console

## AWS Configuration

Before running Terraform, configure your AWS credentials:

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review the Plan

```bash
terraform plan
```

### 3. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm.

### 4. Get Instance Information

After successful deployment, Terraform will output:
- Public IP address
- Instance ID
- Public DNS

You can also view these later with:

```bash
terraform output
```

## Customization

### Change AWS Region

Edit `main.tf` and update the `region` in the provider block, or use variables:

```bash
terraform apply -var="aws_region=us-west-2"
```

### Add SSH Key

1. Create a key pair in AWS EC2 console
2. Uncomment the `key_name` line in `main.tf`
3. Replace with your key pair name:

```hcl
key_name = "your-key-pair-name"
```

### Update AMI

The AMI ID is region-specific. Find the correct AMI for your region:
- Amazon Linux 2023: https://aws.amazon.com/amazon-linux-ami/
- Update the `ami` value in `main.tf`

## Important Notes

### Free Tier Limits
- **Instance Type**: t2.micro (1 vCPU, 1 GB RAM)
- **Storage**: 30 GB EBS storage
- **Usage**: 750 hours/month (sufficient for 1 instance running 24/7)

### Security Considerations
- The security group allows SSH, HTTP, HTTPS, and custom ports (3000, 3001)
- **Warning**: SSH is open to all IPs (0.0.0.0/0). For production, restrict to your IP:
  ```hcl
  cidr_blocks = ["YOUR_IP/32"]
  ```

### Connecting to Your Instance

With SSH key configured:

```bash
ssh -i /path/to/your-key.pem ec2-user@<instance-public-ip>
```

## Deploying Your Application

Once connected to the instance:

1. Clone your repository:
   ```bash
   git clone <your-repo-url>
   cd NOTES\ CIE\ PROJECT
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Configure environment variables for DynamoDB access

5. Start your services (consider using PM2 for production)

## Cleanup

To destroy all resources and avoid charges:

```bash
terraform destroy
```

Type `yes` when prompted.

## Costs

If you stay within AWS Free Tier limits:
- **EC2**: Free for 750 hours/month (t2.micro)
- **EBS Storage**: Free for 30 GB
- **Data Transfer**: 15 GB outbound per month

**Always monitor your AWS billing dashboard to avoid unexpected charges!**

## Resources Created

- VPC (using default VPC)
- Security Group with ingress rules for SSH, HTTP, HTTPS, and custom ports
- EC2 Instance (t2.micro)
- EBS Volume (30 GB)

## Troubleshooting

### Terraform Init Fails
- Ensure Terraform is properly installed
- Check your internet connection

### Terraform Apply Fails
- Verify AWS credentials are configured correctly
- Check if you have necessary IAM permissions
- Ensure the AMI ID is valid for your region

### Cannot Connect to Instance
- Verify security group allows SSH (port 22)
- Ensure you're using the correct key pair
- Check that the instance is in "running" state
- Verify your IP isn't blocked by network firewall

## Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Free Tier Details](https://aws.amazon.com/free/)
- [EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/)
