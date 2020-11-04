import React, { useState } from "react";
import { Alert } from "react-native";
import axios from "axios";
import * as Location from "expo-location";
import * as Permissions from "expo-permissions";
import { gql, useApolloClient, useMutation } from "@apollo/client";
import { UPLOAD_POST, VIEW_FEED } from "../../../queries/Main/MainQueries";
import UploadPhotoPresenter from "./UploadPhotoPresenter";
import ENV from "../../../components/env";

const query = gql`
  query viewFeed {
    viewFeed {
      id
      location
      caption
      user {
        id
        avatar
        username
      }
      files {
        id
        url
      }
      likeCount
      isLiked
      comments {
        id
        text
        user {
          id
          username
          avatar
        }
        createdAt
      }
      createdAt
    }
  }
`;

export default ({ navigation, route }) => {
  const photo = route.params.photo;
  const [loading, setIsLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [caption, setCaption] = useState("");

  const client = useApolloClient();

  const [uploadMutation] = useMutation(UPLOAD_POST, {
    variables: {
      caption,
      location,
    },
  });

  const askPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      return false;
    }
    return true;
  };

  const handleGetLocation = async () => {
    const hasPermission = await askPermission();
    if (!hasPermission) {
      return;
    }

    try {
      //   setIsFetching(true);
      const location = await Location.getCurrentPositionAsync({
        timeout: 5000,
      });
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${ENV.googleApiKey}&language=ja`
      );
      const resData = await res.json();
      const address = resData.results[0].formatted_address.split(" ")[1];
      setLocation(address);
    } catch (e) {
      console.warn(e);
    } finally {
    }
    // setIsFetching(false);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    for (const item of photo) {
      const name = item.filename;
      const [, type] = name.split(".");
      formData.append("file", {
        name: item.filename,
        type: `image/${type.toLowerCase()}`,
        uri: item.uri,
      });
    }
    try {
      setIsLoading(true);
      const {
        data: { locations },
      } = await axios.post(
        "https://api-coco.herokuapp.com/api/upload",
        formData,
        {
          headers: {
            "content-type": "multipart/form-data",
          },
        }
      );
      const {
        data: { uploadPost },
      } = await uploadMutation({
        variables: {
          caption,
          location,
          files: [...locations],
        },
      });
      if (uploadPost.id) {
        client.cache.modify({
          fields: {
            viewFeed(existingPostRefs = [], { readField }) {
              return client.cache.writeQuery({
                query,
                data: {
                  viewFeed: [...existingPostRefs, uploadPost]
                }
              });
            },
          },
        })
        navigation.navigate("Feed", { posted: uploadPost.id });
      }
    } catch (error) {
      console.log(error);
      Alert.alert("エラー", "もう一度アップロードしてください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UploadPhotoPresenter
      photo={photo}
      loading={loading}
      location={location}
      setLocation={setLocation}
      caption={caption}
      setCaption={setCaption}
      handleGetLocation={handleGetLocation}
      handleSubmit={handleSubmit}
    />
  );
};
