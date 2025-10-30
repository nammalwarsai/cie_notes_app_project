# Complete Deployment Guide for Notes CIE Project on EC2

This guide provides step-by-step instructions for deploying the Notes CIE Project on your AWS EC2 instance.

## Prerequisites

✅ EC2 instance running (created via Terraform)
✅ SSH access to EC2 instance via Git Bash
✅ AWS credentials for DynamoDB access
✅ GitHub repository: https://github.com/nammalwarsai/cie_notes_app_project.git

---

## Step 1: Connect to Your EC2 Instance

In Git Bash, connect to your EC2 instance:

```bash
ssh -i /path/to/cie_notes_project.pem ec2-user@<YOUR_EC2_PUBLIC_IP>
```

Replace:
- `/path/to/cie_notes_project.pem` with your actual key pair path
- `<YOUR_EC2_PUBLIC_IP>` with your EC2 instance public IP (from `terraform output`)

---

## Step 2: Update System and Verify Installations

```bash
# Update system packages
sudo yum update -y

# Verify Node.js installation
node --version
npm --version

# Verify Git installation
git --version

# Verify AWS CLI installation
aws --version
```

Expected versions:
- Node.js: v18.x or higher
- npm: 9.x or higher

---

## Step 3: Configure AWS Credentials on EC2

Configure AWS CLI with your credentials to access DynamoDB:

```bash
aws configure
```

Enter the following when prompted:
- **AWS Access Key ID**: `[Your AWS Access Key]`
- **AWS Secret Access Key**: `[Your AWS Secret Key]`
- **Default region name**: `us-east-1` (or your DynamoDB region)
- **Default output format**: `json`

**Note**: These credentials should have DynamoDB permissions (read/write access to your tables).

---

## Step 4: Clone Your GitHub Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/nammalwarsai/cie_notes_app_project.git

# Navigate into the project
cd cie_notes_app_project
```

---

## Step 5: Set Up Backend

### 5.1 Navigate to Backend Directory

```bash
cd ~/cie_notes_app_project/backend
```

### 5.2 Create Backend .env File

Create the environment configuration file:

```bash
nano .env
```

Add the following content (adjust values as needed):

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=user_data
DYNAMODB_ENDPOINT=https://dynamodb.us-east-1.amazonaws.com

# CORS Configuration (Frontend URL)
FRONTEND_URL=http://34.235.127.1983001

# JWT Secret (Generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Session Secret
SESSION_SECRET=your_session_secret_key_change_this_too
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

### 5.3 Install Backend Dependencies

```bash
npm install
```

### 5.4 Test Backend Connection

```bash
# Test DynamoDB connection
node test-dynamodb.js
```

If successful, you should see connection confirmation.

---

## Step 6: Set Up Frontend

### 6.1 Navigate to Frontend Directory

```bash
cd ~/cie_notes_app_project/frontend
```

### 6.2 Create Frontend .env File

```bash
nano .env
```

Add the following content:

```env
# Backend API URL
REACT_APP_API_URL=http://<YOUR_EC2_PUBLIC_IP>:3000

# Environment
NODE_ENV=production
```

Replace `<YOUR_EC2_PUBLIC_IP>` with your actual EC2 public IP address.

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

### 6.3 Install Frontend Dependencies

```bash
npm install
```

### 6.4 Build Frontend for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

---

## Step 7: Install PM2 (Process Manager)

PM2 keeps your Node.js applications running in the background:

```bash
sudo npm install -g pm2
```

---

## Step 8: Start Backend with PM2

```bash
cd ~/cie_notes_app_project/backend

# Start backend server
pm2 start app.js --name notes-backend

# View logs
pm2 logs notes-backend
```

To stop viewing logs, press `Ctrl+C`.

---

## Step 9: Start Frontend with PM2

### Option A: Serve the Production Build (Recommended)

```bash
# Install serve globally
sudo npm install -g serve

# Navigate to frontend directory
cd ~/cie_notes_app_project/frontend

# Start frontend with PM2
pm2 start --name notes-frontend "serve -s build -l 3001"
```

### Option B: Run Development Server (Not recommended for production)

```bash
cd ~/cie_notes_app_project/frontend
pm2 start npm --name notes-frontend -- start
```

---

## Step 10: Configure PM2 to Start on System Boot

```bash
# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Copy and run the command that PM2 outputs
```

PM2 will display a command like:
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

Copy and execute that command.

---

## Step 11: Verify Deployment

### Check PM2 Status

```bash
pm2 status
```

You should see both `notes-backend` and `notes-frontend` running.

### Check Application Logs

```bash
# Backend logs
pm2 logs notes-backend

# Frontend logs
pm2 logs notes-frontend

# All logs
pm2 logs
```

### Test Backend API

```bash
curl http://localhost:3000/health
```

Or from your local machine:
```bash
curl http://<YOUR_EC2_PUBLIC_IP>:3000/health
```

### Access Your Application

Open a web browser and navigate to:
```
http://<YOUR_EC2_PUBLIC_IP>:3001
```

---

## Step 12: Configure Security Group (If Needed)

Ensure your EC2 security group allows:
- **Port 22**: SSH access
- **Port 3000**: Backend API
- **Port 3001**: Frontend application
- **Port 80**: HTTP (optional, for future NGINX setup)
- **Port 443**: HTTPS (optional, for future SSL setup)

---

## Useful PM2 Commands

```bash
# List all processes
pm2 list

# Stop an application
pm2 stop notes-backend
pm2 stop notes-frontend

# Restart an application
pm2 restart notes-backend
pm2 restart notes-frontend

# Delete an application from PM2
pm2 delete notes-backend

# Monitor applications
pm2 monit

# View logs
pm2 logs

# Clear logs
pm2 flush
```

---

## Environment Variables Summary

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `3000` |
| `NODE_ENV` | Environment mode | `production` |
| `AWS_REGION` | AWS region for DynamoDB | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name | `NotesAppTable` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://ec2-ip:3001` |
| `JWT_SECRET` | Secret for JWT tokens | `your_secret_key` |
| `SESSION_SECRET` | Session secret | `your_session_secret` |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://ec2-ip:3000` |
| `NODE_ENV` | Environment mode | `production` |

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs notes-backend

# Common issues:
# 1. Port already in use
sudo lsof -i :3000

# 2. Missing environment variables
cat ~/cie_notes_app_project/backend/.env

# 3. DynamoDB connection issues
aws dynamodb list-tables
```

### Frontend Won't Start
```bash
# Check logs
pm2 logs notes-frontend

# Rebuild frontend
cd ~/cie_notes_app_project/frontend
npm run build
pm2 restart notes-frontend
```

### Cannot Access Application from Browser
1. Check security group allows ports 3000 and 3001
2. Verify EC2 instance is running
3. Check if PM2 processes are running: `pm2 status`
4. Check firewall: `sudo iptables -L`

### DynamoDB Access Errors
```bash
# Test AWS credentials
aws sts get-caller-identity

# Check DynamoDB table
aws dynamodb describe-table --table-name NotesAppTable

# Verify IAM permissions for DynamoDB read/write
```

---

## Updating Your Application

When you push changes to GitHub:

```bash
# SSH into EC2
ssh -i /path/to/cie_notes_project.pem ec2-user@<YOUR_EC2_PUBLIC_IP>

# Navigate to project
cd ~/cie_notes_app_project

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install
pm2 restart notes-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart notes-frontend

# Check status
pm2 status
```

---

## Security Best Practices

### ⚠️ IMPORTANT SECURITY NOTES:

1. **Never commit .env files to GitHub** (already in .gitignore)
2. **Use strong JWT and session secrets** (generate random strings)
3. **Restrict SSH access** to your IP only in security group
4. **Rotate AWS credentials** regularly
5. **Use IAM roles** instead of hardcoded credentials (advanced)
6. **Enable HTTPS** with SSL certificate (Let's Encrypt)
7. **Set up CloudWatch** for monitoring and alerts
8. **Regular backups** of DynamoDB data

### Generating Strong Secrets

On your local machine or EC2:

```bash
# Generate random secret for JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate another for session
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Use these generated values in your `.env` files.

---

## Optional: Set Up NGINX Reverse Proxy

For production, consider using NGINX:

```bash
# Install NGINX
sudo yum install nginx -y

# Configure NGINX (create config file)
sudo nano /etc/nginx/conf.d/notes-app.conf
```

Add configuration to serve frontend on port 80 and proxy backend API.

---

## Monitoring and Maintenance

### Check Disk Space
```bash
df -h
```

### Check Memory Usage
```bash
free -h
```

### Check CPU Usage
```bash
top
```

### View System Logs
```bash
sudo journalctl -u nginx  # If using NGINX
pm2 logs
```

---

## Cost Management

- **Monitor AWS Free Tier usage** in AWS Console
- **Stop EC2 when not needed**: `terraform destroy` (be careful!)
- **Set up billing alerts** in AWS
- **Review DynamoDB usage** regularly

---

## Next Steps (Optional Enhancements)

1. **Set up custom domain** with Route 53
2. **Configure SSL/TLS** with Let's Encrypt
3. **Set up NGINX** as reverse proxy
4. **Configure CI/CD** with GitHub Actions
5. **Set up monitoring** with CloudWatch
6. **Database backups** with DynamoDB backup/restore
7. **Load balancing** for scaling (future)

---

## Support

For issues or questions:
- Check logs: `pm2 logs`
- Review AWS CloudWatch logs
- Verify environment variables
- Check GitHub repository for updates

---

**Happy Deploying! 🚀**
