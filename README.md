# react-native-relay

A working version of react-native with relay.

Fix the compatibility issue as described in https://github.com/facebook/relay/issues/26. 

## Getting Started

### Run GraphQL Server

```
$ git clone https://github.com/relayjs/relay-starter-kit
$ cd relay-starter-kit
$ npm install
$ npm start
```

### Run Native App

#### ios
```
$ git clone https://github.com/lenaten/react-native-relay.git
$ open react-native-relay/ios/fix.xcodeproj
```

#### android
```
$ git clone https://github.com/lenaten/react-native-relay.git
$ cd react-native-relay
$ react-native run-android
```

### Graphql URL Address

The default IP address of graphql server is localhost(127.0.0.1). 
When you run the app on emulator like genymotion or on real device, localhost is not accessible. The graphqlURL config in `config.js` must be updated to accessible one.

## Modified Packages

- react-native
  - version: 0.13.0
  - changes: 
    - https://github.com/facebook/react-native/pull/3625
    - https://github.com/lenaten/react-native-relay/commit/bd06b2a5ead23cfb66a07baccb259ccfc9e04f0c
    - rm React.Children.only constrains in react-relay/node_modules/react-static-container/lib/StaticContainer.react.js
- relay
  - version: 0.4.0
  - changes: 
    - https://github.com/skevy/relay/tree/react-native
- fbjs
  - version: 0.4.0
  - changes: 
    - https://github.com/skevy/fbjs/tree/react-native

## Thanks
- @skevy. You did the real work.
- @boourns
