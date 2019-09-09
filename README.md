# AWS S3 Analytics Enabler Tool

This tool simply enables S3 analytics on all buckets. 

# Support for Athena

In order to give you the option of easily using Amazon Athena, Spectrum, or EMR to query your S3 Analytics reports, this tool configures each bucket's report output with a prefix such that all reports are partitioned in a Hive-compatible format with their bucket name. This is because the CSV files themselves do not contain the bucket name... so we need to partition based on path to make this easily accessible to the Glue data catalog. 

For example, reports will output in this format: 

```
s3://your_report_bucket/s3_analysis/bucket=source_bucket_1/*
s3://your_report_bucket/s3_analysis/bucket=source_bucket_2/*
s3://your_report_bucket/s3_analysis/bucket=source_bucket_3/*
```

Once you've deployed your S3 Analytics reports with this project (or at least, in a similar manner), you can optionally use my project below to quickly catalog these reports in the Glue catalog for querying with Athena: 

https://github.com/matwerber1/aws-s3-analytics-reporting-with-athena

# Deployment

1. Open `tool.js` and edit the two variables below: 

  ```js
  const analytics_bucket = 'werberm-s3-tests-logs';
  const analytics_prefix = 's3_analytics'
  ```

  The `analytics_bucket` should be a pre-existing S3 bucket to which you will want your analytics reports sent. The `analytics_prefix` is a prefix of your choice, *without* a trailing slash. Note that this should be **all lowercase** if you want to use the Glue catalog (e.g. query with Athena). 

2. Add a bucket policy to your analytics bucket that allows S3 Analytics to deliver your reports; see the **S3 Bucket Policy for Report Destination Bucket** section of this Readme for details. 

3. Run the script: 

  ```sh
  node tool.js
  ```

# S3 Bucket Policy for Report Destination Bucket

For each bucket where the S3 Analytics reporting is enabled, this tool will configure the analytics policy to save the analytics report in a bucket of your choosing (configured in the code). In order for the report to be delivered to your reporting bucket, the reporting bucket needs a bucket policy that allows the other bucket(s) to put objects into it. 

You will need to either manually or programmatically give the destination bucket for your analytics reports a bucket policy that allows each source bucket to write to your log bucket. 

If creating a separate policy per source bucket, you would use something like: 

```
{
    "Sid": "S3PolicyStmt-DO-NOT-MODIFY-1567540624370",
    "Effect": "Allow",
    "Principal": {
        "Service": "s3.amazonaws.com"
    },
    "Action": [
        "s3:PutObject"
    ],
    "Resource": [
        "arn:aws:s3:::werberm-s3-tests-logs/*"
    ],
    "Condition": {
        "ArnLike": {
            "aws:SourceArn": [
                "arn:aws:s3:::matwerber.info"
            ]
        },
        "StringEquals": {
            "aws:SourceAccount": [
                "999999999999"
            ],
            "s3:x-amz-acl": "bucket-owner-full-control"
        }
    }
}
```

If creating a single policy, e.g. to allow any bucket to write to your destination log bucket, you could remove the `ArnLike:` condition:

```
{
    "Sid": "S3PolicyStmt-DO-NOT-MODIFY-1567540624370",
    "Effect": "Allow",
    "Principal": {
        "Service": "s3.amazonaws.com"
    },
    "Action": [
        "s3:PutObject"
    ],
    "Resource": [
        "arn:aws:s3:::werberm-s3-tests-logs/*"
    ],
    "Condition": {
        "StringEquals": {
            "aws:SourceAccount": [
                "999999999999"
            ],
            "s3:x-amz-acl": "bucket-owner-full-control"
        }
    }
}
```