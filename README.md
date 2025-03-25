# @ouroboros/body
[![npm version](https://img.shields.io/npm/v/@ouroboros/body.svg)](https://www.npmjs.com/package/@ouroboros/body) ![Custom License](https://img.shields.io/npm/l/@ouroboros/body.svg)

Javascript/Typescript library for connecting to
[body_oc](https://pypi.org/project/body_oc/) RESTlike microservices.

See [Releases](https://github.com/ouroboroscoding/body-js/blob/main/releases.md)
for changes from release to release.

## Installation

Install with npm

```console
foo@bar:~$ npm install @ouroboros/body
```

## Contents
- [Body](#body)
  - [domain](#domain)
  - [request](#request)
  - [on](#on)
  - [onError](#onerror)
  - [onErrorCode](#onerrorcode)
  - [onNoSession](#onnosession)
  - [onRequested](#onrequested)
  - [onRequesting](#onrequesting)
  - [onWarning](#onwarning)
  - [session](#session)
- [Service](#service)
- [Errors](#errors)
- [Constants](#constants)
- [Regex](#regex)

## Body
This is the primary export of the library, it provides a simple asynchronous
way to communicate with [body_oc](https://pypi.org/project/body_oc/)

```javascript
import body, { errors } from '@ouroboros/body';
import React, { useEffect, useState } from 'react';

body.domain('rest.mydomain.com');
body.onError((message, info) => {
  console.error(message, info);
});

function MyApp() {
  const [ loading, setLoading ] = useState(0);
  const [ data, setData ] = useState();
  const [ error, setError ] = useState(false);

  useEffect(() => {
    body.onRequesting(() => {
      setLoading(i => i + 1);
    });
    body.onRequested(() => {
      setLoading(i => {
        i -= 1;
        return (i < 0) ? 0 : i;
      });
    });
  }, [ ]);

  function fetchData() {
    setError(false);
    body.read(
      'my_service',
      'my_request',
      {  _id: 'someid' }
    ).then(setData, setError);
  }

  return <>
    <button onClick={fetchData}>Fetch</button>
    <br />
    {loading &&
      <div>Loading{Array(loading).fill('.').join('')}</div>
    }
    {error &&
      <pre className="error">{JSON.stringify(error, null, 4)}</pre>
    }
    {data ?
      <pre>{JSON.stringify(data, null, 4)}</pre> :
      <span>You haven't fetched the data yet.</span>
    }
  </>
}
```

### domain
The domain indicates the first part of every URL generated to talk to a service.
In the example above we set `rest.mydomain.com` to indicate we want to connect
to **mydomain.com** through a subdomain setup specifically for the services
called **rest**.

If you are unsure what the domain is in your project, contact whoever is in
charge of creating the [body_oc](https://pypi.org/project/body_oc/) services.

Pass nothing to see what the current domain is.

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

### request
`request` is the core of the `body` module. It's how you connect to all service
requests. It takes all the required data and generates an http request to the
server to fetch whatever data is required, then converts that data back into
usable Javascript data your project can use.

It has 4 arguments: `action`, `service`, `noun`, and `data`.

`action` Is the type of request you're making, it must be one of the 4 following
strings, **create**, **read**, **update**, or **delete**.

`service` is the name of the service you want to connect to. This is the name
you have given your service and unique to your project.

`noun` is the name of the request on the service you want to call. This is the
name you have given the request and unique to your project.

`data` is the JSON safe data you wish to send along with the request. If your
data won't go through `JSON.stringify()` then you can't send it with a request.

Most of the time you won't see `request` used directly. Instead you'll see one
of `create`, `delete`, `read`, or `update` which work exactly like `request`
with the `action` substituted for the name of the function. So the `body.read`
call in the example above could have also been written as
```javascript
    body.request(
	  'read',
      'my_service',
      'my_request',
      {  _id: 'someid' }
    ).then(setData, setError);
```

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

### on
`on` works as a shortcut for calling any or all of [onError](#onerror),
[onErrorCode](#onerrorcode), [onNoSession](#onnosession),
[onRequested](#onrequested), [onRequesting](#onrequesting), and
[onWarning](#onwarning). Just remove "on" and make the new first letter
lowercase, i.e. `onError` becomes `error`, `onRequested` becomes `requested`,
etc.

```javascript
import body from '@ouroboros/body';
body.on({
	error: (error, info) => {},
	errorCode: (error, info) => {},
	noSession: () => {},
	warning: (warning, info) => {}
});
```

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

### onError
`onError` sets a callback for whenever the http request fails for some reason
outside of the scope of `body`. The user's internet is down, the service doesn't
even exist, etc.

The first argument is a string describing the error. The second argument is an
object with `action`, `data`, and `url`.

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

### onErrorCode
`onErrorCode` sets a callback for whenever the request goes through, all the
http communication is fine, but the service returns an error with something
gone wrong, either on the server side, or because the client failed to provide
the correct data.

The first argument is the error response, it contains a `code` and a `msg`. The
second argument is an object with `action`, `data`, `res`, and `url`.

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

### onNoSession
`onNoSession` sets a callback for when a request is made with a session token
and the server response that it's not valid. No information is passed to the
callback.

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

### onRequested
`onRequested` sets a callback for after any request is made. It's helpful for
things like stoping loading animations.

The single argument is an object with `action`, `data`, `url`, and `res`.

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

### onRequesting
`onRequesting` sets a callback for before any request is made. It's helpful for
things like starting loading animations.

The single argument is an object with `action`, `data`, and `url`.

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

### onWarning
`onWarning` sets a callback for whenever a request returns a warning in the
result.

The first argument is the warning data, the second is an object with `action`,
`data`, `res`, and `url`.

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

### session
The `session` function is a getter/setter for the current session token. When
keeping track of user requests it's required that a token is used. The token
will most likely come from the server side and need to be stored, in a cookie,
in localStorage, in whatever system works for you.

When a session token is added to `body` it will add it to the **Authorization**
header of every [request](#request) made until `session` is called again with
a different token, or `null` in order to clear the current one.

Pass nothing to see what the current token is.

[ [top](#ouroborosbody), [contents](#contents), [body](#body) ]

## Service
`Service` acts as a way to connect to one specific service without interacting
directly with `body`.

Say you have a project with a single service, or you are creating a re-usable
service and want to offer a simple way to connect to it. Let's call this service
**my_service**. You could create and export a `Service` in your files.

`my_service.js`
```javascript
import { Service } from '@ouroboros/body';
const myService = new Service('my_service');
export default myService;
```

And you could provide that file to anyone wanting to use your service so they
could use it like so.
```javascript
import myService from 'my_service';
myService.domain('rest.mydomain.com');
myService.on({
  error: (error, info) => {},
  warning: (warning, info) => {}
});
myService.create(
  'my/request',
  { /* request data */ }
);
```

This is equivalent to the following
```javascript
import body from '@ouroboros/body';
body.domain('rest.mydomain.com');
body.on({
  error: (error, info) => {},
  warning: (warning, info) => {}
});
body.create(
  'my_service',
  'my/request',
  { /* request data */ }
);
```

Anything you can do with `body` you can do with a `Service` instance as it
contains all the same functions as `body` with all the same arguments except for
when a `service` argument is required, it's filled in by the name of the
`Service`.

[ [top](#ouroborosbody), [contents](#contents) ]

## Errors
`errors` contains constants for all the same errors available in
[body_oc](https://github.com/ouroboroscoding/body/blob/main/README.md#error-codes)

```javascript
import body, { errors } from '@ouroboros/body';
body.domain('rest.mydomain.com');
body.read(
  'my_service',
  'my/request',
  { _id: 'someid' }
).then(res => {},
  error => {
    if(error.code === errors.DATA_FIELDS) {
      // Bad data sent to request
    } else if(error.code === errors.DB_NO_RECORD) {
      // Bad ID, no such record
    } else {
      // Unknown error code
    }
  }
)
```

[ [top](#ouroborosbody), [contents](#contents) ]

## Constants
`constants` contains the same constants available in
[body_oc](https://github.com/ouroboroscoding/body/blob/main/README.md#constants)

[ [top](#ouroborosbody), [contents](#contents) ]

## Regex
`regex` contains the same regular expressions available in
[body_oc](https://github.com/ouroboroscoding/body/blob/main/README.md#regular-expressions)

```javascript
import { regex } from '@ouroboros/body';
if(!regex.EMAIL_ADDRESS.test('me#mydomain.com')) {
  console.error('Invalid email address');
}
```

[ [top](#ouroborosbody), [contents](#contents) ]