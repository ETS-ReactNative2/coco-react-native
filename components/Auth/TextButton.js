import React from "react";
import { TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import colors from "../../colors";

const TextContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Text = styled.Text`
  color: ${colors.black};
  font-size: 14px;
`;

const TextButton = styled.Text`
  margin-left: 5px;
  color: ${colors.primary};
  font-size: 16px;
  font-weight: 600;
`;

export default ({ caption, title, onPress }) => (
  <TextContainer>
    <Text>{caption}</Text>
    <TouchableOpacity onPress={onPress}>
      <TextButton>{title}</TextButton>
    </TouchableOpacity>
  </TextContainer>
);
