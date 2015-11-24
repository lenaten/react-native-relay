# react-native-relay

A working version of react-native with relay.

Fix the compatibility issue as described in https://github.com/facebook/relay/issues/26, by add fixed node_module to git. 

## getting started 
- `git clone https://github.com/lenaten/react-native-relay.git`
- copy your `schema.json` as generated from relay's `updateSchema.js` script to `data/schema.json`.
- set your graphql address in index.android.js or index.ios.js, for example:
```
import Relay from 'react-relay';
Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://192.168.62.1:8080/graphql')
);
```
- `react-native run-android` or start ios version via xcode.
- if everything working as expected, feel free to rename the app name to more attractive name then `fix`.

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

## todo
- add basic graphql server for easy start

Thanks @skevy. You did the real work.
