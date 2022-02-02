import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton } from "@chakra-ui/react";
import { PostSnippetFragment, useVoteMutation } from "../generated/graphql";

interface UpdootSectionProps {
  post: PostSnippetFragment;
}

const UpdootSection:React.FC<UpdootSectionProps> = ({ post }) => {
  const [,vote] = useVoteMutation();
  return (
      <>
          <Flex
              direction="column"
              justifyContent="center"
              alignItems="center"
              mr={4}
          >
              <IconButton
                  aria-label="upvote"
                  icon={<ChevronUpIcon w={6} h={6} />}
                  onClick={
                    () => {
                      console.log("Its clicking");
                      vote({
                        postId:post.id,
                        value:1
                      })
                    }
                  }
              />
              <Box m={2}>{post.points}</Box>
              <IconButton
                  aria-label="downvote"
                  icon={<ChevronDownIcon w={6} h={6} />}
                  onClick={
                    () => {
                      vote({
                        postId:post.id,
                        value:-1
                      })
                    }
                  }
              />
          </Flex>
      </>
  );
}

export default UpdootSection;
