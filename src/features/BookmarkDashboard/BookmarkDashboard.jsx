/*global chrome*/
import React, { Component } from "react";
import { Grid, Sticky, Rail, Segment, List, Icon } from "semantic-ui-react";
import BookmarkCard from "../BookmarkCard/BookmarkCard";
import {
  filterList,
  flattenNode,
  generateUrlImagePair,
  extractHostname,
  chromeTimeValueToDate,
  prepareBookmarkGrowthAnalyticsData,
  preparePopularBookmarkAnalyticsData
} from "../../app/common/util/Util";
import { connect } from "react-redux";
import {
  setMostVisitedSites,
  setBookmarks,
  setSelectedFolder,
  setFilteredBookmarks,
  setSearchedTerm,
  setRecentBookmarks,
  generatePreviewImages,
  saveUrlsToDB,
  updateBookmark
} from "../../redux/Actions/ActionTypes/DashBoardActions";
import SearchComponent from "../Search/SearchBookmark";
import BookmarkRecommendationCard from "../BookmarkCard/BookmarkRecommendationCard";
import BookmarkGrowthAnalytics from "../AnalyticsCard/BookmarkGrowthAnalytics";
import PopularBookmarkLinkAnalytics from "../AnalyticsCard/PopularBookmarkLinkAnalytics";
import debounce from "lodash.debounce";
import BookmarkbuddyLogoGrey3 from "../../app/assets/images/BookmarkbuddyLogoGrey.png";
import { SortTypes } from "../../app/common/constants";
import AboutUs from "../AboutUs/AboutUs";

class BookmarkDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookmarks: [],
      context: null,
      context2: null,
      activeItem: "home",
      userId: "",
      isAboutUs: false
    };
  }
  localBookmarks = [];
  bookmarkCreationDates = [];
  bookmarkUrls = [];
  //Only Bookmark Folder Tree Structure
  bookmarkFolderTree = [];

  //Culprit for a bug. Need to initialize like this. TODO need to think of a better approach
  cardDataBookmarkGrowth = {
    data: [
      {
        id: "Total Number of Bookmarks",
        color: "hsl(275, 70%, 50%)",
        data: []
      }
    ]
  };
  //Culprit for the same mentioned nasty bug. Need to initialize like this. TODO need to think of a better approach
  cardDataPopularBookmarks = {
    data: [{}],
    totalTopBookmarksCount: 0,
    topFiveSites: []
  };

  componentWillMount() {
    // this.setUserID();
    this.getBookmarks();
  }

  // setUserID = () => {
  //   chrome.storage.sync.get(["uniqueID"], items => {
  //     if (Object.keys(items).length === 0 && items.constructor === Object) {
  //       let userid = this.getRandomToken();
  //       chrome.storage.sync.set({ uniqueID: userid }, () => {
  //         this.setState({ userId: items.uniqueID });
  //       });
  //     } else {
  //       this.setState({ userId: items.uniqueID });
  //     }
  //   });
  // };

  getRandomToken = () => {
    let randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    let hex = "";
    for (var i = 0; i < randomPool.length; ++i) {
      hex += randomPool[i].toString(16);
    }
    return hex;
  };

  onSortCategoryClick = sortcategory => () => {
    this.localBookmarks.sort((a, b) => {
      if (sortcategory === SortTypes.URL) {
        return extractHostname(a[sortcategory]) >
          extractHostname(b[sortcategory])
          ? 1
          : extractHostname(b[sortcategory]) > extractHostname(a[sortcategory])
          ? -1
          : 0;
      }
      if (sortcategory === SortTypes.DATE_ADDED) {
        return a[sortcategory] > b[sortcategory]
          ? -1
          : b[sortcategory] > a[sortcategory]
          ? 1
          : 0;
      }
      return a[sortcategory] > b[sortcategory]
        ? 1
        : b[sortcategory] > a[sortcategory]
        ? -1
        : 0;
    });
    this.setState({ bookmarks: [] });
    this.addBookmarksInState(18);
  };

  setLocalBookmarks = bookmarks => {
    this.localBookmarks = [];
    this.localBookmarks.push(...bookmarks);
    //TODO move it to another method, reset the bookmarks in state
    this.setState({ bookmarks: [] });
  };

  handleContextRef = ref => {
    this.setState({ context: ref });
  };

  handleContextRef2 = ref => {
    this.setState({ context2: ref });
  };
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.bookmarks.length > 0 &&
      this.props.bookmarks !== nextProps.bookmarks
    ) {
      let urls = generateUrlImagePair(nextProps.bookmarks);
      // set or get Unique ID
      chrome.storage.sync.get(["uniqueID"], items => {
        if (Object.keys(items).length === 0 && items.constructor === Object) {
          let userid = this.getRandomToken();
          chrome.storage.sync.set({ uniqueID: userid }, () => {
            this.setState({ userId: items.uniqueID });
            //----------
            let bookmarkObj = {
              uniqueID: items.uniqueID
                ? items.uniqueID
                : "qwerty1234567ojhjhcxfxb",
              bookmarks: urls
            };
            this.props.callSaveUrls(bookmarkObj);
            //---------
          });
        } else {
          this.setState({ userId: items.uniqueID });
          //----------
          let bookmarkObj = {
            uniqueID: items.uniqueID
              ? items.uniqueID
              : "qwerty1234567ojhjhcxfxb",
            bookmarks: urls
          };
          this.props.callSaveUrls(bookmarkObj);
          //---------
        }
      });
    }
  }

  getUpdateBookmarkTree = selectedFolder => {
    this.getBookmarks(selectedFolder);
    this.setState({ bookmarks: [] });
    this.addBookmarksInState(15);
  };

  getBookmarks = selectedFolder => {
    let flattenedBookmarks = [];

    //============
    // const bookmarks = {
    //   children: [
    //     {
    //       children: [
    //         {
    //           dateAdded: 1374042255838,
    //           id: "15",
    //           index: 0,
    //           parentId: "1",
    //           title: "Work and its secret",
    //           url:
    //             "http://www.ramakrishnavivekananda.info/vivekananda/volume_2/work_and_its_secret.htm"
    //         },
    //         {
    //           dateAdded: 1517039291544,
    //           id: "17",
    //           index: 2,
    //           parentId: "1",
    //           title: "AirVūz Drone Videos – United By Drone",
    //           url: "https://www.airvuz.com/"
    //         },
    //         {
    //           dateAdded: 1553150509072,
    //           id: "18",
    //           index: 3,
    //           parentId: "1",
    //           title:
    //             "Internet Archive: Digital Library of Free & Borrowable Books, Movies, Music & Wayback Machine",
    //           url: "https://archive.org/"
    //         },
    //         {
    //           children: [
    //             {
    //               dateAdded: 1557765883273,
    //               id: "29",
    //               index: 0,
    //               parentId: "30",
    //               title: "Resources - Google Sheets",
    //               url:
    //                 "https://docs.google.com/spreadsheets/d/1xkC4qCfCSAmvx4EPUQ-VgB73Wj2lt8lczGtv3ETm3-c/edit#gid=1676630641"
    //             },
    //             {
    //               dateAdded: 1557765932224,
    //               id: "31",
    //               index: 1,
    //               parentId: "30",
    //               title: "BookmarkBuddy - Google Drive",
    //               url:
    //                 "https://drive.google.com/drive/folders/1tH-EKfJ-_CDCRSt4WwZ1gedu8HHFR0Ur"
    //             },
    //             {
    //               children: [
    //                 {
    //                   dateAdded: 1557765974569,
    //                   id: "33",
    //                   index: 0,
    //                   parentId: "34",
    //                   title: "GitHub - AnBera/bookmarkbuddy",
    //                   url: "https://github.com/AnBera/bookmarkbuddy"
    //                 },
    //                 {
    //                   dateAdded: 1557765939737,
    //                   id: "32",
    //                   index: 1,
    //                   parentId: "34",
    //                   title: "AnirbanBera / linkpreview / index.js — Bitbucket",
    //                   url:
    //                     "https://bitbucket.org/AnirbanBera/linkpreview/src/master/index.js"
    //                 }
    //               ],
    //               dateAdded: 1557766024556,
    //               dateGroupModified: 1557766033851,
    //               id: "34",
    //               index: 2,
    //               parentId: "30",
    //               title: "Code base"
    //             }
    //           ],
    //           dateAdded: 1557765922433,
    //           dateGroupModified: 1557766029251,
    //           id: "30",
    //           index: 4,
    //           parentId: "1",
    //           title: "Bookmark Buddy"
    //         }
    //       ],
    //       dateAdded: 1556819554156,
    //       dateGroupModified: 1553150509072,
    //       id: "1",
    //       index: 0,
    //       parentId: "0",
    //       title: "Bookmarks bar"
    //     },
    //     {
    //       children: [],
    //       dateAdded: 1556819554156,
    //       id: "2",
    //       index: 1,
    //       parentId: "0",
    //       title: "Other bookmarks"
    //     },
    //     {
    //       children: [
    //         {
    //           children: [
    //             {
    //               dateAdded: 1498146026212,
    //               id: "10",
    //               index: 0,
    //               parentId: "5",
    //               title:
    //                 "Build a NodeJS cinema microservice and deploying it with docker — part 1",
    //               url:
    //                 "https://medium.com/@cramirez92/build-a-nodejs-cinema-microservice-and-deploying-it-with-docker-part-1-7e28e25bfa8b"
    //             },
    //             {
    //               dateAdded: 1498425848323,
    //               id: "11",
    //               index: 1,
    //               parentId: "5",
    //               title:
    //                 "Simulated Raspberry Pi to cloud (Node.js) - Connect Raspberry Pi web simulator to Azure IoT Hub | Microsoft Docs",
    //               url:
    //                 "https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-raspberry-pi-web-simulator-get-started"
    //             },
    //             {
    //               dateAdded: 1499521788121,
    //               id: "12",
    //               index: 2,
    //               parentId: "5",
    //               title: "Grammar and spellchecker – English – Reverso",
    //               url:
    //                 "http://www.reverso.net/spell-checker/english-spelling-grammar/"
    //             },
    //             {
    //               dateAdded: 1505136521174,
    //               id: "14",
    //               index: 3,
    //               parentId: "5",
    //               title: "UEFA Champions League - Fantasy Football - Leagues",
    //               url: "http://uclfantasy.uefa.com/en/fantasy17/leagues"
    //             }
    //           ],
    //           dateAdded: 1556820286198,
    //           dateGroupModified: 1556820286198,
    //           id: "5",
    //           index: 0,
    //           parentId: "3",
    //           title: "Node js"
    //         },
    //         {
    //           dateAdded: 1445713137500,
    //           id: "6",
    //           index: 1,
    //           parentId: "3",
    //           title:
    //             "Fantasy Premier League - The official fantasy football game of the Barclays Premier League",
    //           url:
    //             "http://fantasy.premierleague.com/entry/1327912/event-history/10/"
    //         },
    //         {
    //           dateAdded: 1400399042189,
    //           id: "7",
    //           index: 2,
    //           parentId: "3",
    //           title: "Staff selection Commission syllabus",
    //           url: "http://ssc.nic.in/syllabus/CombinedGraduateLevelExam.html"
    //         },
    //         {
    //           dateAdded: 1388635402089,
    //           id: "8",
    //           index: 3,
    //           parentId: "3",
    //           title: "Cognizant Mail",
    //           url:
    //             "https://mail.cognizant.com/owa/auth/logon.aspx?url=https://mail.cognizant.com/owa/&reason=0"
    //         }
    //       ],
    //       dateAdded: 1556819554156,
    //       dateGroupModified: 1554660844248,
    //       id: "3",
    //       index: 2,
    //       parentId: "0",
    //       title: "Mobile bookmarks"
    //     }
    //   ],
    //   dateAdded: 1558025293160,
    //   id: "0",
    //   title: ""
    // };
    // flattenNode(
    //   bookmarks,
    //   flattenedBookmarks,
    //   this.bookmarkCreationDates,
    //   this.bookmarkUrls,
    //   this.bookmarkFolderTree
    // );
    // //this.setState({bookmarkFolderTree:this.bookmarkFolderTree});
    // this.cardDataBookmarkGrowth = prepareBookmarkGrowthAnalyticsData(
    //   this.bookmarkCreationDates,
    //   flattenedBookmarks.length
    // );
    // this.cardDataPopularBookmarks = preparePopularBookmarkAnalyticsData(
    //   this.bookmarkUrls
    // );

    // this.localBookmarks.push(...flattenedBookmarks);
    // this.addBookmarksInState(18);
    // window.onscroll = debounce(() => {
    //   //------------
    //   let scrollTop = document.documentElement.scrollTop;
    //   let windowHeight = window.innerHeight;
    //   let bodyHeight = document.documentElement.scrollHeight - windowHeight;
    //   let scrollPercentage = scrollTop / bodyHeight;

    //   console.log(scrollTop, windowHeight, bodyHeight, scrollPercentage);

    //   // if the scroll is more than 90% from the top, load more content.
    //   if (scrollPercentage > 0.9) {
    //     // Load content
    //     //   }
    //     // //-------------
    //     // if (
    //     //   window.innerHeight + document.documentElement.scrollTop
    //     //   === document.documentElement.offsetHeight
    //     // ) {
    //     // Do awesome stuff like loading more content!
    //     this.addBookmarksInState(6);
    //   }
    // }, 100);
    // this.props.setBookmarks({ bookmarks: flattenedBookmarks });
    //============

    // let recentBookmarks = [{ "dateAdded": 1557765974569, "id": "33", "index": 0, "parentId": "34", "title": "GitHub - AnBera/bookmarkbuddy", "url": "https://github.com/AnBera/bookmarkbuddy" }];
    // // flattenNode(bookmarks, recentBookmarks);
    // // this.localRecentBookmarks.push(...recentBookmarks);
    // this.props.setRecentBookmarks({bookmarks : recentBookmarks});

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // chrome.bookmarks.getRecent(4, bookmarksArr => {
    //   this.props.setRecentBookmarks({ bookmarks: bookmarksArr }); //TODO need to think of destructuring
    //   // this.localRecentBookmarks.push(...bookmarksArr);
    //   // this.setState({ recentBookmarks: bookmarksArr })
    // });

    // // not working
    // // chrome.topSites.get(sites => {
    // //   // flattenNode(treeNode[0], flattenedBookmarks);
    // //   console.log(sites);
    // // })

    chrome.bookmarks.getTree(treeNode => {
      this.resetBookmarkData();
      flattenNode(
        treeNode[0],
        flattenedBookmarks,
        this.bookmarkCreationDates,
        this.bookmarkUrls,
        this.bookmarkFolderTree
      );
      this.cardDataBookmarkGrowth = prepareBookmarkGrowthAnalyticsData(
        this.bookmarkCreationDates,
        flattenedBookmarks.length
      );
      this.cardDataPopularBookmarks = preparePopularBookmarkAnalyticsData(
        this.bookmarkUrls
      );
      this.localBookmarks = [];
      this.localBookmarks.push(...flattenedBookmarks);
      this.addBookmarksInState(18);
      window.onscroll = debounce(() => {
        let scrollTop = document.documentElement.scrollTop;
        let windowHeight = window.innerHeight;
        let bodyHeight = document.documentElement.scrollHeight - windowHeight;
        let scrollPercentage = scrollTop / bodyHeight;

        if (scrollTop > 400) {
          document.querySelector(".analytics-container").style.display = "none";
        }
        if (scrollTop <= 10) {
          document.querySelector(".analytics-container").style.display =
            "block";
        }

        // if the scroll is more than 70% from the top, load more content.
        if (scrollPercentage > 0.7) {
          // Load more content!
          this.addBookmarksInState(21);
        }
      }, 100);
      this.props.setBookmarks({ bookmarks: flattenedBookmarks }); //TODO need to think of destructuring
      if (selectedFolder)
        this.setSelectedFolderAndFilter(
          selectedFolder ? selectedFolder : this.props.selectedFolder
        );
    });
  };

  resetBookmarkData = () => {
    this.bookmarkCreationDates = [];
    this.bookmarkUrls = [];
    this.bookmarkFolderTree = [];
  };

  setSelectedFolderAndFilter = selectedFolder => {
    this.props.setSelectedFolder(selectedFolder);
    //this.props.setSearchedTerm("");
    let filteredBookmarks = [];
    //no folder selected
    if (selectedFolder === "-- Select all --" || selectedFolder === "") {
      //no folder selected no searchtext selected
      if (this.props.searchTerm === "")
        filteredBookmarks = [...this.props.bookmarks];
      //no folder selected some searchtext selected
      else
        filteredBookmarks = filterList(
          this.props.searchTerm,
          this.props.bookmarks
        );
      //some folder selected
    } else {
      //some folder selected no searchtext selected
      if (this.props.searchTerm === "") {
        filteredBookmarks = this.props.bookmarks.filter(
          element => element.category === selectedFolder
        );
        this.setState({ bookmarksInsideFolder: filteredBookmarks.length });
      }
      //some folder selected some searchtext selected
      else
        filteredBookmarks = filterList(
          this.props.searchTerm,
          this.props.bookmarks.filter(
            element => element.category === selectedFolder
          )
        );
    }
    this.setLocalBookmarks(filteredBookmarks);
    this.addBookmarksInState(15);
    this.props.setFilteredBookmarks({ bookmarks: filteredBookmarks });
  };

  addBookmarksInState = numberOfBookmarks => {
    setTimeout(() => {
      if (
        this.state.bookmarks.length + numberOfBookmarks <
        this.localBookmarks.length
      ) {
        this.setState((prev, props) => ({
          bookmarks: this.localBookmarks.slice(
            0,
            prev.bookmarks.length + numberOfBookmarks
          )
        }));
      } else if (
        this.localBookmarks.length - this.state.bookmarks.length > 0 &&
        this.localBookmarks.length - this.state.bookmarks.length <=
          numberOfBookmarks
      ) {
        this.setState((prev, props) => ({
          bookmarks: this.localBookmarks.slice(0)
        }));
      }
    }, 0);
  };

  updateBookmark = (index, bookmark) => {
    let modifiedBookmark = [...this.state.bookmarks];
    if (
      modifiedBookmark.length > 0 &&
      modifiedBookmark[index].id === bookmark.id
    ) {
      modifiedBookmark[index].title = bookmark.title;
      modifiedBookmark[index].url = bookmark.url;
      this.setState({ bookmarks: modifiedBookmark }, () => {
        this.props.UpdateBookmarks(modifiedBookmark);
      });
    }
  };

  closeModal = () => {
    this.setState({ isAboutUs: false }, () => {});
  };

  render() {
    let Bookamrks = [...this.state.bookmarks];
    return (
      <>
        <div ref={this.handleContextRef} style={{ marginTop: "2em" }}>
          <Rail
            internal
            position="left"
            attached
            style={{ top: "auto", height: "80px", width: "100%" }}
          >
            <Sticky context={this.state.context}>
              <div
                style={{
                  backgroundColor: "#161626",
                  textAlign: "center",
                  height: "60px"
                }}
              >
                <img src={BookmarkbuddyLogoGrey3} alt="BookmarkBuddy" />
                <span className="about-icon-wrapper">
                  <Icon
                    link
                    name="info circle"
                    color="grey"
                    className="about-icon"
                    onClick={e => {
                      e.preventDefault();
                      this.setState({ isAboutUs: !this.state.isAboutUs });
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                  />
                </span>
                <AboutUs
                  isOpen={this.state.isAboutUs}
                  closeModal={this.closeModal}
                />
              </div>
            </Sticky>
          </Rail>

          {/* <Grid container columns="equal" stackable style={{paddingTop:"2em"}}>
            <Grid.Row>
              {this.props.recentBookmarks.map((bookmark, idx) => {
                return (
                  <Grid.Column>
                    <BookmarkRecentCard bookmark={bookmark} key={bookmark.id} />
                  </Grid.Column>
                );
              })}
            </Grid.Row>
          </Grid> */}

          <Grid container columns={3} stackable className="analytics-container">
            <Grid.Column className="analytics-card-container">
              <BookmarkGrowthAnalytics {...this.cardDataBookmarkGrowth} />
            </Grid.Column>
            <Grid.Column className="analytics-card-container">
              <PopularBookmarkLinkAnalytics
                {...this.cardDataPopularBookmarks}
              />
            </Grid.Column>
            <Grid.Column
              className="analytics-card-container"
              style={{
                overflowY: "auto",
                paddingRight: "0",
                paddingBottom: "0"
              }}
            >
              {this.state.userId && (
                <BookmarkRecommendationCard
                  bookmarks={Bookamrks}
                  userId={this.state.userId}
                />
              )}
            </Grid.Column>
          </Grid>
        </div>

        <div ref={this.handleContextRef2} style={{ padding: "1em" }}>
          <Rail
            internal
            position="left"
            attached
            style={{ top: "auto", height: "auto", width: "100%" }}
          >
            <Sticky context={this.state.context2}>
              <Segment inverted style={{ backgroundColor: "#161626" }}>
                <Grid container columns="equal" stackable>
                  {this.props.bookmarks.length > 0 && (
                    <Grid.Row>
                      <SearchComponent
                        context={this.state.context2}
                        bookmarks={Bookamrks}
                        addBookmarksInState={this.addBookmarksInState}
                        setLocalBookmarks={this.setLocalBookmarks}
                      />
                      <Grid.Column width={16}>
                        <span className="display-count">
                          {" "}
                          Displaying{" "}
                          {this.props.searchTerm || this.props.selectedFolder
                            ? this.props.FilteredBookmarks.length
                            : this.props.bookmarks.length}{" "}
                          items{" "}
                        </span>
                        <List
                          floated="right"
                          horizontal
                          className="sortContainer"
                        >
                          <List.Item style={{ color: "grey" }}>
                            Sort By:
                          </List.Item>
                          <span
                            className="item"
                            onClick={this.onSortCategoryClick("dateAdded")}
                          >
                            Date Added
                          </span>
                          <span
                            className="item"
                            onClick={this.onSortCategoryClick("title")}
                          >
                            Title
                          </span>
                          <span
                            className="item"
                            onClick={this.onSortCategoryClick("url")}
                          >
                            Url
                          </span>
                        </List>
                      </Grid.Column>
                    </Grid.Row>
                  )}
                </Grid>
              </Segment>
            </Sticky>
          </Rail>
          <Grid
            container
            columns="equal"
            stackable
            style={{ marginTop: "7em" }}
          >
            <Grid.Row>
              <Grid.Column>
                {Bookamrks.map((bookmark, i) => {
                  if (i % 3 === 0)
                    return (
                      <BookmarkCard
                        userId={this.state.userId}
                        key={bookmark.id}
                        isconvertedSuccessfully={this.props.isImagesConverted}
                        bookmark={bookmark}
                        setSelectedFolderAndFilter={
                          this.setSelectedFolderAndFilter
                        }
                        getUpdateBookmarkTree={this.getUpdateBookmarkTree.bind(
                          this
                        )}
                        updateBookamark={this.updateBookmark.bind(this, i)}
                        colorsMap={this.props.colorsMap}
                        bookmarkFolderTree={this.bookmarkFolderTree}
                      />
                    );
                })}
              </Grid.Column>
              <Grid.Column>
                {Bookamrks.map((bookmark, i) => {
                  chromeTimeValueToDate(bookmark.dateAdded);
                  if (i % 3 === 1)
                    return (
                      <BookmarkCard
                        userId={this.state.userId}
                        key={bookmark.id}
                        isconvertedSuccessfully={this.props.isImagesConverted}
                        bookmark={bookmark}
                        setSelectedFolderAndFilter={
                          this.setSelectedFolderAndFilter
                        }
                        getUpdateBookmarkTree={this.getUpdateBookmarkTree.bind(
                          this
                        )}
                        updateBookamark={this.updateBookmark.bind(this, i)}
                        colorsMap={this.props.colorsMap}
                        bookmarkFolderTree={this.bookmarkFolderTree}
                      />
                    );
                })}
              </Grid.Column>
              <Grid.Column>
                {Bookamrks.map((bookmark, i) => {
                  if (i % 3 === 2)
                    return (
                      <BookmarkCard
                        userId={this.state.userId}
                        key={bookmark.id}
                        bookmark={bookmark}
                        setSelectedFolderAndFilter={
                          this.setSelectedFolderAndFilter
                        }
                        getUpdateBookmarkTree={this.getUpdateBookmarkTree.bind(
                          this
                        )}
                        updateBookamark={this.updateBookmark.bind(this, i)}
                        colorsMap={this.props.colorsMap}
                        bookmarkFolderTree={this.bookmarkFolderTree}
                      />
                    );
                })}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </div>
      </>
    );
  }
}
const mapDispatchToProps = dispatch => {
  return {
    setVisitedSites: sites => {
      dispatch(setMostVisitedSites(sites));
    },
    setBookmarks: bookmarks => {
      dispatch(setBookmarks(bookmarks));
    },
    setRecentBookmarks: bookmarks => {
      dispatch(setRecentBookmarks(bookmarks));
    },
    setSelectedFolder: folder => {
      dispatch(setSelectedFolder(folder));
    },
    setFilteredBookmarks: (bookmarks = []) => {
      dispatch(setFilteredBookmarks(bookmarks));
    },
    setSearchedTerm: text => {
      dispatch(setSearchedTerm(text));
    },
    callGenerateImages: urls => {
      dispatch(generatePreviewImages(urls));
    },
    callSaveUrls: objs => {
      dispatch(saveUrlsToDB(objs));
    },
    UpdateBookmarks: bookmarkArray => {
      dispatch(updateBookmark(bookmarkArray));
    }
  };
};
const mapStateToProps = state => ({
  bookmarks: state.DashBoardReducer.Bookmarks,
  recentBookmarks: state.DashBoardReducer.recentBookmarks,
  FilteredBookmarks: state.DashBoardReducer.FilteredBookmarks,
  searchTerm: state.DashBoardReducer.searchTerm,
  selectedFolder: state.DashBoardReducer.selectedFolder,
  colorsMap: state.DashBoardReducer.colorsMap,
  isImagesConverted: state.DashBoardReducer.isImagesConverted
});
export default connect(mapStateToProps, mapDispatchToProps)(BookmarkDashboard);
