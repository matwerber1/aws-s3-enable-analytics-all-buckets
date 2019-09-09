const aws = require('aws-sdk');
const s3 = new aws.S3();

// UPDATE AS NEEDED
const analytics_bucket = 'werberm-s3-tests-logs';
const analytics_prefix = 's3_analytics'
//const analytics_log_bucket_account_id = "999999999999";

async function main() {
  
  // the async is also helpful for avoiding throttling limits
  var listBucketsResponse = await s3.listBuckets().promise();
  await asyncForEach(listBucketsResponse.Buckets, async (bucket) => {
    await EnableS3Analytics(bucket.Name);
  });

}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function EnableS3Analytics(target_bucket) {

  var analytics_config_id = 'analytics-config';
  var target_bucket_arn = `arn:aws:s3:::${target_bucket}`;
  var analytics_bucket_arn = `arn:aws:s3:::${analytics_bucket}`;
  var full_prefix = `${analytics_prefix}/bucket=${target_bucket}`;

  var params = {
    AnalyticsConfiguration: { 
      Id: analytics_config_id,
      StorageClassAnalysis: { 
        DataExport: {
          Destination: { 
            S3BucketDestination: { 
              Bucket: analytics_bucket_arn,
              Format: "CSV",
              //BucketAccountId: analytics_log_bucket_account_id,
              Prefix: full_prefix
            }
          },
          OutputSchemaVersion: "V_1"
        }
      },
      // by excluding filter, all objects are included
      /*
      Filter: {
        And: {
          Prefix: 'STRING_VALUE',
          Tags: [
            {
              Key: 'STRING_VALUE', 
              Value: 'STRING_VALUE'
            },
  
          ]
        },
        Prefix: 'STRING_VALUE',
        Tag: {
          Key: 'STRING_VALUE', 
          Value: 'STRING_VALUE'
        }
      }
      */
    },
    Bucket: target_bucket,
    Id: analytics_config_id
  };

  console.log(`Putting analytics config for bucket ${target_bucket_arn}`);
  response = await s3.putBucketAnalyticsConfiguration(params).promise();
  console.log('Put successful\n');
  return;
}


(async () => {
    try {
        await main();
    }
    catch (e) {
        console.log("Unhandled error: " + e);
    }
})();