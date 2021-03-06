## Description
 This is a simple library, which helps to initialize connection between microservices by amqp protocol.

### How to initialize
Prepare callback function. Example:

```js
  const handleMessage = async (message: IMessage) => {
    switch (message.code) {
      case (MessageCodes.DO_SMTG): {
        const result = await service.doSmtg(message.body);
        return result;
      }
    }
  }
```

Call configureService function. First parameter is a Service name, second is a callback function.

Non-required params:
- connectionString - address of amqp service, default is amqp://localhost:5672;
- prefetch - the maximum number of messages sent over the channel that can be awaiting acknowledgement, default is 100.

Example:

```js
  await configureService('serviceName', handleMessage, 'connectionString', prefetch);
```

### How to use
If you want to call function from another service, you should use sendRequest method.
It would search required function in specified service from handleMessage function by message code.

  Example:
```js
  const result = await sendRequest(MessageCodes.DO_SMTG, data, 'serviceName');
```
In case of service unavailable (in case of service restart or etc) requests would be stored in queue and executes when service would be available.
