/*global chrome*/
import React, { Component } from "react";
import { Card, Image, Label, Icon } from "semantic-ui-react";
import { extractHostname, generateImageName } from "../../app/common/util/Util";
import Hover from "../../app/common/Component/Hover";
import Configs from "../../app/common/constants";
import {
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  LinkedinIcon
} from "react-share";
import RemoveBookmark from "./DeleteBookmark";
import EditBookmark from "../EditBookmark/EditBookmark";

class BookmarkCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEdit: false,
      selectedFolder: null
    };
  }

  //Changed Bookmark Node Array
  changedBookamrkFolder = [];

  //selectedFolder={};
  onCategoryClick = e => {
    e.preventDefault();
    this.props.setSelectedFolderAndFilter(e.target.innerText);
  };

  isImageLoaded = true;

  onImageLoad = e => {
    e.target.style = { visibility: "visible" };
    e.target.parentElement.style = { visibility: "visible" };
  };

  onImageError = e => {
    // this.props.setImageReceiveFailure();
    this.isImageLoaded = false;
    // e.target.src = 'some default image url'
  };

  closeEditModal = () => {
    this.changedBookamrkFolder.forEach(item => {
      item.isOpen = false;
      item.isSelected = false;
    });
    this.props.getUpdateBookmarkTree();
    this.setState({ isEdit: false }, () => {});
  };

  render() {
    const { bookmark, colorsMap } = this.props;
    let style = {
      borderBottomColor: colorsMap[bookmark.category]
    };
    let hostName = extractHostname(bookmark.url);

    return (
      <>
        {!this.state.isEdit && (
          <Card fluid>
            <Card.Content href={bookmark.url}>
              <span className="ui transparent floating label context-icons">              
                <Icon name="pin" size="large" />
                <Icon
                  onClick={e => {
                    e.preventDefault();
                    this.setState({ isEdit: !this.state.isEdit });
                  }}
                  name="edit"
                  size="large"
                />
                <RemoveBookmark Objbookmark={bookmark} />
              </span>

              {/* <Label as='a' color='grey' ribbon='right'>
          <Icon name='pin' />
        </Label> */}
              {this.isImageLoaded && (
                <div
                  className="imageContainer"
                  style={{ backgroundColor: colorsMap[bookmark.category] }}
                >
                  <span className="initialAltText">
                    {extractHostname(bookmark.url).charAt(0)}
                  </span>
                  <div className="overlay" style={{ visibility: "hidden" }}>
                    <Image
                      className="imageThubmbnail"
                      floated="right"
                      size="tiny"
                      src={Configs.imageurl + generateImageName(bookmark.url)}
                      style={{ visibility: "hidden" }}
                      onLoad={this.onImageLoad}
                      onError={this.onImageError}
                    />
                  </div>
                </div>
              )}
              {!this.isImageLoaded && (
                <div
                  className="imageContainer"
                  style={{ backgroundColor: colorsMap[bookmark.category] }}
                >
                  <span className="initialAltText">
                    {extractHostname(bookmark.url).charAt(0)}
                  </span>
                  <Image floated="right" size="tiny" src="" />
                </div>
              )}
              {/*TODO use onclick to filter based on sitename */}
              <div className="url-heading">
                <Image
                  className="padding-right-medium"
                  src={`chrome://favicon/${bookmark.Url}`}
                />
                {hostName.length > 23
                  ? hostName.substring(0, 23 - 3) + "..."
                  : hostName}
              </div>
              <Card.Meta>{bookmark.title}</Card.Meta>
              <Hover
                onHover={
                  <Label
                    attached="bottom left"
                    style={{ backgroundColor: colorsMap[bookmark.category] }}
                    onClick={this.onCategoryClick}
                  >
                    {bookmark.category}
                    <span className="category" />
                  </Label>
                }
              >
                <Label attached="bottom left" onClick={this.onCategoryClick}>
                  {bookmark.category}
                  <span className="category" style={style} />
                </Label>
              </Hover>
              <FacebookShareButton                
                url={bookmark.Url}
                quote={`Shared via Bookmarkbuddy:${bookmark.title}`}
              ><FacebookIcon round={true} size={"1.5rem"}></FacebookIcon></FacebookShareButton>

              <TwitterShareButton
                round={true}
                url={bookmark.Url}
                title={`Shared via Bookmarkbuddy:${bookmark.title}`}
              ><TwitterIcon round={true} size={"1.5rem"}></TwitterIcon></TwitterShareButton>
              <LinkedinShareButton
                round={true}
                url={bookmark.Url}
                title={`Shared via Bookmarkbuddy:${bookmark.title}`}
              ><LinkedinIcon round={true} size={"1.5rem"}></LinkedinIcon></LinkedinShareButton>
              <WhatsappShareButton
                round={true}
                url={bookmark.Url}
                title={`Shared via Bookmarkbuddy:${bookmark.title}`}
              ><WhatsappIcon round={true} size={"1.5rem"}></WhatsappIcon></WhatsappShareButton>
            </Card.Content>
          </Card>
        )}
        <EditBookmark
          changedBookamrkFolder={this.changedBookamrkFolder}
          bookmarkFolderTree={this.props.bookmarkFolderTree}
          updateBookamark={this.props.updateBookamark}
          colorsMap={colorsMap}
          selectedBookmark={bookmark}
          isOpen={this.state.isEdit}
          closeModal={this.closeEditModal}
        />
      </>
    );
  }
}

export default BookmarkCard;
