import React from 'react-native';
import Relay from 'react-relay';
import Back from './Back';

var {
  ListView,
  View,
  Text,
  TextInput,
  TouchableHighlight,
  StyleSheet,
} = React;

var Collection = React.createClass ({

  getInitialState() {
    var ds = new ListView.DataSource({rowHasChanged: function rowHasChanged(r1, r2) {
      if (typeof r1.isLoading !== 'undefined') {
        return true;
      }
      return r1 !== r2;
    }});
    return {
      dataSource: ds.cloneWithRows([]),
      first: 0,
    };
  },

  componentWillMount() {
    if (this.state.first > 0) {
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this.props.viewer.widgets.edges),
      });
    }
  },

  componentWillReceiveProps(nextProps) {
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(nextProps.viewer.widgets.edges),
    });
  },

  renderRow(edge,b, id) {
    return (
      <View>
        <Text>---{++id}---</Text>
        <Text style={styles.key}>ID:</Text>
        <Text style={styles.value}>{edge.node.id}</Text>
        <Text style={styles.key}>NAME:</Text>
        <Text style={styles.value}>{edge.node.name}</Text>
      </View>
    );
  },

  onChangeText(first) {
    first = first || 0;

    if (first > 0) {
      this.props.relay.setVariables({
        first: +first
      });
    }

    if ( first === 0 ) {
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows([]),
      });
    }

    this.setState({first});
  },

  render() {
      return (
      <View style={styles.view}>
        <TextInput
          autoFocus={true}
          onChangeText={this.onChangeText}
          text={this.state.first}
          placeholder="number of items"
          keyboardType="number-pad"
        />
        <Text style={styles.key}>Has Previous Page:</Text>
        <Text style={styles.value}>{this.props.viewer.widgets.pageInfo.hasPreviousPage ? "true":"false"}</Text>
        <Text style={styles.key}>Has Next Page:</Text>
        <Text style={styles.value}>{this.props.viewer.widgets.pageInfo.hasNextPage ? "true":"false"}</Text>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderRow}
        />
        <Back navigator={this.props.navigator}/>
      </View>
    );
  }
});

export default Relay.createContainer(Collection, {
  initialVariables: {
    first: 1,
  },
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        widgets(first: $first) {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            node {
              id
              name
            },
          },
        },
      }
    `,
  },
});

var styles = StyleSheet.create({
  key: {
    color: 'red',
  },
  value: {
    color: 'green',
  },
  view: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
