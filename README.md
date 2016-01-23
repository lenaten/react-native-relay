# react-native-relay

[![Join the chat at https://gitter.im/lenaten/react-native-relay](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/lenaten/react-native-relay?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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

#### Genymotion

Find the network interface name in:
VirtualBox ->  [Your Android VM] -> Settings -> Network -> Adapter Attached [0] To Host Only Adapter -> Name.
Find the IP address with `ifconfig` command, then replace the localhost string in config.js with the IP address.

### babelRelayPlugin.js
The modified version of react-native explicitly looks for `babelRelayPlugin.js` in `<projectRoot>/scripts`.

## Modified Packages

- react-native
  - version: 0.18.0 (self built)
  - changes:
    - https://github.com/facebook/react-native/pull/5084
    - https://github.com/facebook/react-native/pull/5214
- relay
  - version: 0.6.0 (self built)
  - changes:
    - https://github.com/facebook/relay/pull/713
    - https://github.com/facebook/relay/pull/714
- fbjs
  - version: 0.7.0 (self-built)
  - changes:
    - https://github.com/facebook/fbjs/pull/95

## Thanks
- @skevy. You did the real work.
- @boourns
