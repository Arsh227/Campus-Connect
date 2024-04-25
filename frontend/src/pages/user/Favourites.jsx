import React, { useState, useEffect, useCallback } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component';
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { Flex, Text, HStack, Card, CardHeader, Avatar, Box, Heading, Popover, PopoverTrigger, IconButton, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverBody, VStack, CardBody, Link, Image } from '@chakra-ui/react';
import { BsThreeDotsVertical } from 'react-icons/bs'

export default function Favourites() {
  const api = useAxiosPrivate()
  const [page, setPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const LIMIT = 10;
  const [totalPosts, setTotalPosts] = useState(0);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        await api.get(`/api/post/get-saved-posts/${page}/${LIMIT}`)
          .then(({ data }) => {
            setActivePage(activePage + 1);
            setTotalPosts(data.total)
            setItems(data?.posts)
          })
          .catch((error) => {
            console.error(error);
          });

      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchPosts()
  }, [])
  const fetchMoreData = useCallback(() => {
    try {
      api.get(`/api/post/get-posts-feed/${activePage}/${LIMIT}`)
        .then(({ data }) => {
          setActivePage(activePage + 1);
          setItems(prevItems => [...prevItems, ...data.posts]);
          setPage(page + 1);
        })
        .catch((error) => {
          console.error(error);
        });

    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }, [items.length, activePage, totalPosts])

  const HandleDeletedPost = (postid) => {
    const filteredPosts = items.filter(post => post._id !== postid)
    setItems(filteredPosts)
  }



  return (
    <InfiniteScroll
      dataLength={items.length}
      next={fetchMoreData}
      hasMore={items.length < totalPosts}
      loader={<Flex w="400px" justifyContent={'center'} alignItems={'center'}><Text>Loading...</Text></Flex>}
      endMessage={<Flex pb={10} w="400px" justifyContent={'center'} alignItems={'center'}><Text>No more items to load</Text></Flex>}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginLeft: '0px' }}
    >
      {
        items.length > 0 ? (
          items?.slice().reverse().map((post, index) => (
            <div key={index} style={{ padding: '20px', margin: '10px 0' }}>
              <Card minW={'lg'} maxW='lg'>
                <CardHeader>
                  <Flex spacing='4'>
                    <Flex flex='1' gap='4' alignItems='center' flexWrap='wrap'>
                      <Avatar name='Segun Adebayo' src='https://bit.ly/sage-adebayo' />

                      <Box>
                        <Heading size='sm'>{post.post_user_name}</Heading>
                        <Text>{post.post_user_email}</Text>
                      </Box>
                    </Flex>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Text pb={3}>
                    {post.post_description}
                  </Text>
                  <HStack>
                    {post?.post_files_n_folders?.length > 0 && (
                      <>
                        {post.post_files_n_folders.map((file, index) => (
                          <HStack key={index} spacing="20px">
                            <Link href={file.url} target="_blank" rel="noopener noreferrer">
                              <Image src={file.data.icon} alt="icon" width="50px" height="50px" />
                            </Link>
                          </HStack>
                        ))}
                      </>
                    )}
                  </HStack>

                </CardBody>
              </Card>
            </div>
          )
          )
        ) : (null)
      }
    </InfiniteScroll>
  )
}
