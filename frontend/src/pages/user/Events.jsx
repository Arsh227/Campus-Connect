import React, { useEffect, useState } from 'react'
import { Badge, Box, Divider, HStack, Text, VStack } from '@chakra-ui/react';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import Calendar from 'react-calendar';

export default function Events() {
  const api = useAxiosPrivate();

  const [events, setevents] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await api.get('/api/user/get-events');
        setevents(data.events);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    }
    fetchAnnouncements()
  }, []);
  return (
    <Box textAlign="center" mt={8} mb={8}>
      <Text fontSize="xl" color="indigo.50" mt={0} mb={8}>
        Events
      </Text>

      <Box maxWidth="400px" mx="auto">
        {
          events.length > 0 ? (
            events.map((ann) => (
              <Box
                bg="white"
                boxShadow={'lg'}
                color="black"
                rounded="full"
                display="flex"
                alignItems="center"
                justifyContent="flex-start"
                p={2}
                mb={4}
              >

                <VStack w="100%" justifyContent={'flex-start'} alignItems={'flex-start'}>
                  <HStack justifyContent={'space-between'} w="100%" spacing={0}>
                    <HStack >
                      <Badge p={2} bg="green.200" fontSize="xs" rounded="full" py={1} px={2} mr={2}>
                        NEW
                      </Badge>
                      <Text borderRadius={10} color={'white'} pt={1} pr={3} pb={1} pl={3} bg={'blue.300'} flex="2" fontSize="sm">
                        {ann.title}
                      </Text>
                    </HStack>
                    <Box pr={3}>
                      <Text fontSize={'small'}>
                        {ann.date}
                      </Text>
                    </Box>
                  </HStack>
                  <Text pl={3} flex="2" fontSize="sm">
                    {ann.description}
                  </Text>
                </VStack>
              </Box>

            ))
          ) : (<Box>
            No new events
          </Box>)
        }


        <Divider color="gray.500" />
        <Text color={'gray.300'} _hover={{ textDecoration: 'underline', cursor: 'pointer' }}>Older announcements</Text>
      </Box>
    </Box>
  )
}
