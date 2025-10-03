# DynamoDB Setup for Loan Decisions

## Table Schema

Create a DynamoDB table named `loan-decisions` with the following configuration:

### Table Configuration
```json
{
  "TableName": "loan-decisions",
  "KeySchema": [
    {
      "AttributeName": "loan_id",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "timestamp",
      "KeyType": "RANGE"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "loan_id",
      "AttributeType": "S"
    },
    {
      "AttributeName": "timestamp",
      "AttributeType": "S"
    }
  ],
  "BillingMode": "PAY_PER_REQUEST",
  "TimeToLiveSpecification": {
    "AttributeName": "ttl",
    "Enabled": true
  }
}
```

### Item Structure
```json
{
  "loan_id": "LOAN-1234567890",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "decision": "APPROVED",
  "confidence": 0.92,
  "interest_rate": 6.5,
  "loan_term": 30,
  "approval_amount": 425000,
  "reasoning": "Strong credit profile and adequate income",
  "conditions": [],
  "stipulations": [],
  "borrower_name": "John Smith",
  "loan_amount": 425000,
  "credit_score": 760,
  "risk_score": 25,
  "risk_level": "LOW",
  "compliance_status": "compliant",
  "compliance_score": 95,
  "processing_status": "completed",
  "ttl": 1705320600
}
```

## AWS CLI Commands

### Create the table:
```bash
aws dynamodb create-table \
  --table-name loan-decisions \
  --attribute-definitions \
    AttributeName=loan_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=loan_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --time-to-live-specification \
    AttributeName=ttl,Enabled=true
```

### Query examples:
```bash
# Get all decisions for a loan
aws dynamodb query \
  --table-name loan-decisions \
  --key-condition-expression "loan_id = :loan_id" \
  --expression-attribute-values '{":loan_id": {"S": "LOAN-1234567890"}}'

# Get recent decisions (last 24 hours)
aws dynamodb scan \
  --table-name loan-decisions \
  --filter-expression "processing_status = :status" \
  --expression-attribute-values '{":status": {"S": "completed"}}'
```

## S3 Bucket Setup

### Create S3 bucket:
```bash
aws s3 mb s3://loan-documents-bucket
```

### Configure S3 event notification:
```bash
# Create event notification configuration
cat > s3-event-config.json << EOF
{
  "LambdaConfigurations": [],
  "QueueConfigurations": [],
  "TopicConfigurations": [],
  "EventBridgeConfiguration": {}
}
EOF

# Apply configuration (you'll need to configure this in AWS Console for n8n trigger)
```

## Required AWS Permissions

Your AWS credentials need these permissions:

### DynamoDB:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/loan-decisions"
    }
  ]
}
```

### S3:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::loan-documents-bucket",
        "arn:aws:s3:::loan-documents-bucket/*"
      ]
    }
  ]
}
```

### Bedrock:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*:*:model/*"
    }
  ]
}
```

## n8n Configuration

1. **S3 Trigger**: Configure to monitor `loan-documents-bucket` for new PDF files
2. **DynamoDB Output**: Configure to write to `loan-decisions` table
3. **AWS Credentials**: Ensure all AWS services have proper access

## Testing

### Upload a test document:
```bash
aws s3 cp test-loan-document.pdf s3://loan-documents-bucket/loan-applications/
```

### Check DynamoDB for results:
```bash
aws dynamodb scan --table-name loan-decisions --limit 10
```

