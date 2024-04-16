'use client'

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel"

import { CarouselApi } from "@/components/ui/carousel"
  
import { MessageCircleWarning } from 'lucide-react'
import { useToast } from "@components/ui/use-toast"

import { Textarea } from "@components/ui/textarea"
import {
    Alert,
    AlertDescription,
    AlertTitle,
  } from "@/components/ui/alert"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@components/ui/button"

import ReactMarkdown from 'react-markdown'
  

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

import { Skeleton } from "@/components/ui/skeleton"

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.withXSRFToken = true

const client = axios.create({
    withCredentials: true,
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withXSRFToken: true
})

const AIPage = () => {

    const router = useRouter()
    const { toast } = useToast()
    const [convoList, setConvoList] = useState([])
    
    const [userResponse, setUserResponse] = useState('')
    const [isLoading, setIsLoading] = useState(true) // This is to show a skeleton and disable the submit button

    const [data, setData] = useState('')

    const [api, setApi] = useState() // Carousel API

    const [gotSummary , setGotSummary] = useState(false)
    const [journal, setJournal] = useState({})
 
    useEffect(() => {
        if (!api) {
        return
        }
    
        api.on("slidesChanged", () => {
            api.scrollNext()
        })

    }, [api])
    
    let isMounted = true

    useEffect(() => {
        client.get("/api/user").then((response) => {
            console.log("Heartbeat check successful")
        }).catch((error) => {
            router.push('/login')
        })
    })

    const handleTextareaChange = (event) => {
        setUserResponse(event.target.value);
      };

    const handleSubmit = () => {
        if (userResponse !== '') {
            setIsLoading(true)
            client.post("/api/aichat", {
                user_response: userResponse,
                convo_list: convoList,
                final_ai_message: data
            }).then((response) => {
                setConvoList([...convoList, {ai: data, human: userResponse}])
                setData(response.data['message']);
                setUserResponse('')
                setConvoList([...convoList, {ai: data, human: userResponse}])
                setIsLoading(false)
            }).catch(err => {
                toast({
                    title: "An error occurred",
                    description: 'We were unable to process your request. Please try again later.',
                    variant: 'destructive'
                })
                console.error(err);
                setIsLoading(false)
            });
        }
    }

    useEffect(() => {
        // Make the initial POST request when the component mounts
        const fetchData = async () => {
        try {
            const initialData = { user_response: '', initial_message: true};
            const response = await client.post('/api/aichat', initialData);
            setData(response.data['message']);
            setIsLoading(false);
        } catch (error) {
            toast({
                title: "An error occurred",
                description: 'We were unable to process your request. Please try again later.',
                variant: 'destructive'
            })
            console.error(error);
        }
        };
    
        if (isMounted) {
            fetchData();
        }

        return () => {
            isMounted = false;
        }
      }, []);

    
    const handleStop = () => {
        // Get summary of conversation
        setIsLoading(true)
        client.post("/api/aichatsummary", {
            user_response: userResponse,
            convo_list: convoList,
            final_ai_message: data
        }).then((response) => {
            setGotSummary(true)
            setIsLoading(false)
            let title = response.data.title
            let summary = response.data.summary
            let content = response.data.journal_content

            setJournal({
                journal_title: title,
                journal_summary: summary,
                journal_content: content,
                datetimee: new Date(),
                journal_type: 'assisted'
            })

            toast({
                title: "Conversation successfully stopped",
                description: 'You have stopped the conversation with Mushane.',
                variant: 'success'
            })
        }).catch(err => {
            toast({
                title: "An error occurred",
                description: 'We were unable to process your request. Please try again later.',
                variant: 'destructive'
            })
            console.error(err);
        });
    }
    
    const handleSummarizedJournalSave = () => {
        client.post("/api/journalsave", journal).then((response) => {
            toast({
                title: "Success",
                description: "Journal saved successfully!",
                variant: "success",
            })
            setGotSummary(false)
            router.push('/dashboard')
        }).catch((error) => {
            toast({
                title: "Error",
                description: "An error occurred while saving your journal. Try again later",
                variant: "destructive",
            })
            setGotSummary(false)
            console.error(error);
            router.push('/dashboard')
        });
    }
    
    return (
        <section className="ai_chat_container px-12 h-full">
            <Alert className="mb-10 text-lg">
                <MessageCircleWarning className="h-4 w-4" />
                <AlertTitle>What's this?</AlertTitle>
                <AlertDescription>
                    The feed below details your chat with our AI (Mushane). Use the arrows to navigate through the conversation and look at the history.
                    <br />
                    To stop the conversation at any time, click on the <span className="text-red-300">Stop</span> button below the textbox, and to submit your response, click on the <span className="text-green-300">Submit</span> button!
                </AlertDescription>
            </Alert>


            {
            gotSummary ?
            <>
                <div>
                    <div className="text-2xl font-bold">{journal.journal_title}</div>
                    <div className="mt-2 text-xl"><ReactMarkdown>{journal.journal_summary}</ReactMarkdown></div>
                </div>
                <Button onClick={handleSummarizedJournalSave} className="mt-12">Great!</Button>
            </>
            :
            <>
                <Carousel setApi={setApi}>
                    <CarouselContent>
                        {convoList.map((convo, index) => {
                            return (
                                <CarouselItem key={`convo-item-${index}`}>
                                    <Card className="p-5 mb-10 bg-transparent">
                                        <p className="leading-loose">
                                            <span className="text-green-500 font-bold">Mushane:</span> {convo.ai}
                                        </p>
                                    </Card>
                                    <Textarea className="text-lg h-96 block outline-none p-5 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none" disabled value={convo.human}/>
                                </CarouselItem>
                            );
                            }
                        )}

                            <CarouselItem>
                                <Card className="p-5 mb-10 bg-transparent">
                                    <div className="leading-loose">
                                        {isLoading ? (<Skeleton className="h-10"/>) : <><span className="text-green-500 font-bold">Mushane:</span> {data} </>}
                                    </div>
                                </Card>
                                <Textarea className="text-lg h-96 block outline-none p-5 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none" disabled={isLoading} value={userResponse} onChange={handleTextareaChange}/>
                            </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext/>
                </Carousel>
                <div className="flex justify-between">
                    <Button className="mt-10 bg-red-600 text-white hover:bg-red-700" disabled={isLoading} onClick={handleStop}>Stop</Button>
                    <Button className="mt-10 bg-green-600 text-white hover:bg-green-700" disabled={isLoading} onClick={handleSubmit}>Submit</Button>
                </div>
            </>
            }
        </section>
    )    
  }
  
export default AIPage