import React from 'react-native';
import Relay from 'react-relay';

var {
  ListView,
  View,
  Text,
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
    };
  },

  componentWillMount() {
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(this.props.viewer.widgets.edges),
    });
  },

  renderRow(edge) {
    return (
      <View>
        <Text>ID: {edge.node.id}</Text>
        <Text>NAME: {edge.node.name}</Text>
      </View>
    );
  },

  render() {
      return (
      <View>
        <Text>Collection Example:</Text>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderRow}
        />
      </View>
    );
  }
});

export default Relay.createContainer(Collection, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        widgets(first: 10) {
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
