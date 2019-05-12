import React, { Component } from "react";
import { Grid, Button, Card, Image, Icon, Label } from "semantic-ui-react";

class BookmarkCard extends Component {
  render() {
    const { bookmark } = this.props;
    return (
      <Grid.Column>
        <Card fluid>
          <Card.Content href="https://react.semantic-ui.com/">
            <Image
              floated="right"
              size="tiny"
              src="https://react.semantic-ui.com/images/avatar/large/steve.jpg"
            />
            {/*TODO use onclick to filter */}
            <div className="url-heading">
              <Icon name="user" />
              {bookmark.url}
            </div>
            <Card.Meta>{bookmark.title}</Card.Meta>
            <Label attached="bottom right">UI/UX</Label>
          </Card.Content>
        </Card>
      </Grid.Column>
    );
  }
}

export default BookmarkCard;