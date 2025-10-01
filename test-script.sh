#!/bin/bash

# Test script for n8n Enterprise Loan Processing Workflow
echo "🚀 Testing n8n Enterprise Loan Processing Workflow"
echo "=================================================="

# Check if n8n is running
echo "📡 Checking n8n server status..."
if curl -s http://localhost:5678/healthz > /dev/null; then
    echo "✅ n8n server is running"
else
    echo "❌ n8n server is not running. Please start n8n first."
    echo "   Run: npx n8n"
    exit 1
fi

# Get webhook URLs
WEBHOOK_JSON_URL="http://localhost:5678/webhook/loan-application"
WEBHOOK_FILE_URL="http://localhost:5678/webhook/file-upload"

echo ""
echo "🔗 Webhook URLs:"
echo "   JSON Webhook: $WEBHOOK_JSON_URL"
echo "   File Upload: $WEBHOOK_FILE_URL"

# Test 1: JSON Webhook
echo ""
echo "📋 Test 1: Testing JSON webhook..."
curl -X POST "$WEBHOOK_JSON_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "TEST-LOAN-001",
    "borrower_name": "John Smith",
    "loan_amount": 350000,
    "property_address": "456 Oak Street, Austin, TX 78701",
    "annual_income": 95000,
    "credit_score": 750,
    "employment_status": "Full-time",
    "loan_purpose": "Primary Residence Purchase",
    "loan_term": 30,
    "property_value": 450000,
    "documents": [
      {
        "filename": "pay_stub.pdf",
        "mimeType": "application/pdf",
        "size": 2048,
        "content": "Pay stub showing $95,000 annual salary"
      }
    ],
    "source": "test_data",
    "processing_status": "ready_for_analysis"
  }' \
  --max-time 60 \
  --write-out "\nHTTP Status: %{http_code}\n" \
  --silent --show-error

echo ""
echo "📋 Test 2: Testing with invalid data (should trigger error response)..."
curl -X POST "$WEBHOOK_JSON_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "TEST-LOAN-002",
    "borrower_name": "",
    "loan_amount": 25000,
    "property_address": "",
    "annual_income": 0,
    "credit_score": 0
  }' \
  --max-time 60 \
  --write-out "\nHTTP Status: %{http_code}\n" \
  --silent --show-error

echo ""
echo "📋 Test 3: Testing file upload webhook..."
curl -X POST "$WEBHOOK_FILE_URL" \
  -F "file=@test-workflow.json" \
  --max-time 60 \
  --write-out "\nHTTP Status: %{http_code}\n" \
  --silent --show-error

echo ""
echo "✅ Testing completed!"
echo ""
echo "🔍 Check the n8n UI at http://localhost:5678 to see execution results"
echo "📊 Look for any failed nodes or error messages"
