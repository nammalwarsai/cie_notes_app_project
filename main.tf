# Terraform configuration for AWS EC2 instance (Free Tier)

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "us-east-1"  # Change this to your preferred region
  # AWS credentials will be read from ~/.aws/credentials or environment variables
}

# Data source to get the latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Create a VPC (or use default)
resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}

# Create a security group for EC2 instance
resource "aws_security_group" "notes_app_sg" {
  name        = "notes-app-security-group"
  description = "Security group for Notes CIE Project EC2 instance"
  vpc_id      = aws_default_vpc.default.id

  # Allow SSH access
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Warning: Open to all. Restrict to your IP in production
  }

  # Allow HTTP access
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS access
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow Node.js backend port (adjust as needed)
  ingress {
    description = "Node.js Backend"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow React frontend port (adjust as needed)
  ingress {
    description = "React Frontend"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "notes-app-sg"
  }
}

# Create EC2 instance (Free Tier eligible)
resource "aws_instance" "notes_app_server" {
  ami           = data.aws_ami.amazon_linux_2023.id  # Automatically uses the latest Amazon Linux 2023 AMI
  instance_type = "t2.micro"                         # Free tier eligible

  vpc_security_group_ids = [aws_security_group.notes_app_sg.id]

  # Key pair for SSH access
  key_name = "cie_notes_project"

  # Root volume configuration (Free tier: 30 GB)
  root_block_device {
    volume_size = 30
    volume_type = "gp2"
    delete_on_termination = true
  }

  # User data script to initialize the instance
  user_data = <<-EOF
              #!/bin/bash
              # Update system
              yum update -y
              
              # Install Node.js
              curl -sL https://rpm.nodesource.com/setup_18.x | bash -
              yum install -y nodejs
              
              # Install Git
              yum install -y git
              
              # Install AWS CLI (if needed for DynamoDB access)
              yum install -y aws-cli
              EOF

  tags = {
    Name        = "notes-cie-project-server"
    Project     = "Notes CIE Project"
    Environment = "development"
  }
}

# Output the public IP address
output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.notes_app_server.public_ip
}

# Output the instance ID
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.notes_app_server.id
}

# Output the public DNS
output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.notes_app_server.public_dns
}
