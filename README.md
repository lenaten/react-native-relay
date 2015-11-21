# react-native-relay

A working version of react-native with relay.

Fix the compatibility issue as described in https://github.com/facebook/relay/issues/26, by add fixed node_module to git. 

## getting started 

You actually only need the node_modules folder and update your dependencies list in package.json.
- copy `node_modules` recursively to your exisitng project.
- add these dependency to your `package.json` file:
  - "react-native": "0.13.0"
  - "react-relay": "0.4.0"

## modified packages

- react-native
  - version: 0.13.0
  - changes: https://github.com/facebook/react-native/pull/3625
- relay
  - version: 0.4.0
  - changes: https://github.com/skevy/relay/tree/react-native
- fbjs
  - version: 0.4.0
  - changes: https://github.com/skevy/fbjs/tree/react-native

Thanks @skevy. You did the real work.
