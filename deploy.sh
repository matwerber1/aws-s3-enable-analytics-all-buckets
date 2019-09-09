# Edit as needed; this should be a bucket you have write access to: 
BUCKET=werberm-sandbox
STACK=s3-analytics-athena

echo 'Creating CloudFormation package...'
aws cloudformation package \
  --template-file template.yaml \
  --s3-bucket $BUCKET \
  --output-template-file package.json

# Deploy our changes
echo 'Deploying CloudFormation package...'
aws cloudformation deploy \
  --template-file package.json \
  --stack-name $STACK \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides AnalyticsBucket='werberm-s3-tests-logs' AnalyticsKeyPrefix='s3-storage-class-analysis'