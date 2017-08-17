# lambda-example
Example REST service for Lambda article I wrote: https://medium.com/p/4730c88cd39a

* **EmailServices.js** - a small JavaScript class containing services to get/send e-mail.

* **lambdaHandlers.js** - contains a set of Lambda handler functions which wrap the EmailServices methods. These handler functions are designed to be deployed to AWS Lambda, accepting parameters of _event_, _context_ and _callback_.  They extract parameters from the _event_ object and return a response object to the _callback_.

* **serverless.yaml** - a configuration file for the Serverless Framework. If you run `npm run deploy` it will call `serverless deploy`, which itself will look at that configuration file to determine what to deploy to AWS (in this case, the functions in lambdaHandlers.js as Lambda functions, and some http endpoints in API Gateway to trigger those Lambda functions).
It will also expect to find a file called env.yml containing environment variables for the deployed services. I'm not sure what happens if that file doesn't exist.

* **examples** Contains examples for the env.yml file, what an _event_ object looks like, what a _context_ object looks like, and an example of a JSON file that can be used to test a Lambda function locally, like: 

```serverless invoke local -f getEmail -p example.json```
