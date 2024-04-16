"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

import React from 'react';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
  

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer"

import { Calendar } from "@/components/ui/calendar"  

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"  

import { Textarea } from "@/components/ui/textarea"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

import ReactMarkdown from 'react-markdown'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useToast } from "@components/ui/use-toast";
import { set } from "date-fns";
import { Skeleton } from "@components/ui/skeleton";

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.withXSRFToken = true

const client = axios.create({
    withCredentials: true,
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withXSRFToken: true
})

const Dashboard = () => {

    const router = useRouter()

    const [userName, setUserName] = useState()
    const [journals, setJournals] = useState([])
    const [moods, setMoods] = useState([])
    const [journalContent, setJournalContent] = useState('')
    const [isJournalSummaryLoading, setIsJournalSummaryLoading] = useState(false)
    const [gotSummary, setGotSummary] = useState(false)
    
    const {toast}  = useToast()

    useEffect(() => {
        client.get("/api/user").then((response) => {
            setUserName(response.data.user.username)
        }).catch((error) => {
            router.push('/login')
        })
    })

    useEffect(() => {
        client.get("/api/userjournals").then((response) => {
            setJournals(response.data.journals)
        }).catch((error) => {
            console.log(error)
        })
    }, [])

    useEffect(() => {
        client.get("/api/usermoods").then((response) => {
            setMoods(response.data.moods)
        }).catch((error) => {
            console.log(error)
        })
    }, [])

    const mood_values = ['😀', '🙂', '😐', '😕', '😞']
    const handleMoodSubmit = () => {
        const selectedMoodElement = document.getElementById('mood-value-id')
        // Find the emoji as the first character of the inner text using moods
        const selectedMood = mood_values.find((mood) => selectedMoodElement.innerText.startsWith(mood))
    
        if (selectedMood) {
            const moodData = {
                mood_value: selectedMood,
            };

            // Send mood data to the backend
            client.post("/api/moodlog", moodData)
                .then((response) => {
                    // Handle success
                    toast({
                        title: "Success",
                        description: "Mood submitted successfully!",
                        variant: "success",
                    })
                    setMoods([...moods, {mood_value: moodData.mood_value, datetime: new Date()}])
                })
                .catch((error) => {
                    // Handle error
                    toast({
                        title: "Error",
                        description: "An error occurred while submitting your mood. Try again later",
                        variant: "destructive",
                    })
                });
        } else {
            toast({
                title: "Hey Sneaky!",
                description: "Please select a mood before submitting",
                variant: "destructive",
            });
        }
    };
        
    const combinedData = journals.concat(moods)

    combinedData.sort((a, b) => {
        return new Date(b.datetime) - new Date(a.datetime)
    })

    const handleJournalChange = (event) => {
        setJournalContent(event.target.value)
    }
    
    const handleJournalSubmit = () => {
        if (journalContent !== '') {
            const journalData = {
                journal_content: journalContent,
            };
            
            setIsJournalSummaryLoading(true)
            client.post("/api/journalsummary", journalData)
                .then((response) => {
                    toast({
                        title: "Success",
                        description: "Journal processed successfully!",
                        variant: "success",
                    })
                    
                    let title = response.data.title
                    let summary = response.data.summary
                    
                    setJournals([...journals, {journal_title: title, journal_content: journalData.journal_content, journal_summary: summary, datetime: new Date(), journal_type: 'normal'}])
                    setIsJournalSummaryLoading(false)
                    setGotSummary(true)
                })
                .catch((error) => {
                    toast({
                        title: "Error",
                        description: "An error occurred while submitting your journal. Try again later",
                        variant: "destructive",
                    })
                    console.log(error)
                    setIsJournalSummaryLoading(false)
                });
        } else {
            toast({
                title: "Hey Sneaky!",
                description: "Please write something before submitting",
                variant: "destructive",
            });
        }
    }

    const handleSummarizedJournalSave = () => {
        let title = journals[journals.length - 1].journal_title
        let summary = journals[journals.length - 1].journal_summary
        let journal_content = journals[journals.length - 1].journal_content
        let datetime = journals[journals.length - 1].datetime
        let journal_type = 'normal'
        const journalData = {
            journal_title: title,
            journal_content: journal_content,
            journal_summary: summary,
            datetime: datetime,
            journal_type: journal_type
        };

        client.post("/api/journalsave", journalData).then((response) => {
            toast({
                title: "Success",
                description: "Journal saved successfully!",
                variant: "success",
            })
            setGotSummary(false)
        }).catch((error) => {
            toast({
                title: "Error",
                description: "An error occurred while saving your journal. Try again later",
                variant: "destructive",
            })
            setGotSummary(false)
        });
    }

    const jD = journals.map(journal => {
        const date = new Date(journal.datetime);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });

    const journalDays = [];
    jD.forEach(day => {
        if (!journalDays.some(d => d.getTime() === day.getTime())) {
            journalDays.push(day);
        }
    });

  return (
    <div>
        <div className="text-center text-6xl mb-10">Welcome to your mind, {userName}!</div>


        <div className="flex justify-center items-center w-full text-3xl">
            <Calendar
                mode="multiple"
                selected={journalDays}
                className="rounded-md w-1/2"/>


            You have written for {journalDays.length} day(s)!
        </div>
      

        <div className="flex justify-center items-center text-2xl mt-10 gap-4 mb-16">
            How are you feeling right now?
            <Select>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Mood" id="mood-value-id"/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="5" className="text-xl">😀 Excited</SelectItem>
                    <SelectItem value="4" className="text-xl">🙂 Content</SelectItem>
                    <SelectItem value="3" className="text-xl">😐 Neutral</SelectItem>
                    <SelectItem value="2" className="text-xl">😕 Miffed</SelectItem>
                    <SelectItem value="1" className="text-xl">😞 Sad</SelectItem>
                </SelectContent>
            </Select>

            <Button variant="secondary" onClick={handleMoodSubmit}>Submit</Button>
        </div>

        <div className="flex justify-center mt-10 gap-4 mb-16">
        
        <Link href='/ai' className={`${buttonVariants({ variant: "secondary" })}`}>
            <p className='font-semibold'>Use AI-assisted journaling</p>
        </Link>

        <Drawer>
        
        <DrawerTrigger asChild>
            <Button variant="secondary">Start Writing</Button>
        </DrawerTrigger>

        <DrawerContent className="p-10" style={{ height: '90%' }}>
            <DrawerHeader className='mb-5'>
            <DrawerTitle>What's up?</DrawerTitle>
            <DrawerDescription>Start writing to your heart's content. Submit when you are ready, and we will do the rest.</DrawerDescription>
            </DrawerHeader>
            
            { isJournalSummaryLoading ? <Skeleton className="h-20"/> :  
                gotSummary ? <div>
                    <div className="text-xl font-bold">{journals[journals.length -1].journal_title}</div>
                    <div className="mt-2 text-lg"><ReactMarkdown>{journals[journals.length -1].journal_summary}</ReactMarkdown></div>
                </div> : <Textarea placeholder="Today I..." className="text-lg h-full outline-none p-5 focus-visible:ring-1 resize-none" onChange={handleJournalChange}/> }
            
            <DrawerFooter className='w-2/12 mx-auto'>
                
            
            {isJournalSummaryLoading ? <></> : gotSummary ? 
                <>
                <Button onClick={handleSummarizedJournalSave}>Great!</Button>
                </>
                :
                <>
                <Button onClick={handleJournalSubmit}>Submit</Button>
                <DrawerClose>
                    <Button variant="outline">Cancel</Button>
                </DrawerClose>
                </>
            }
            
            </DrawerFooter>
        </DrawerContent>
        </Drawer>

        <div className="mt-10 text-xl">
            
        </div>

        </div>

        <Table className="mt-10 text-xl">
            <TableCaption>Your Entries (moods and journals)</TableCaption>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type (mood or journal)</TableHead>
                <TableHead>Details</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {combinedData.map((entry, index) => {
                    return (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{(new Date(entry.datetime)).toLocaleString()}</TableCell>
                            
                            { entry.mood_value ?
                                <TableCell>Mood</TableCell> 
                                :
                                <TableCell>Journal ({entry.journal_type.charAt(0).toUpperCase() + entry.journal_type.slice(1)})</TableCell>
                            }   
                            {
                            entry.mood_value ?
                                <TableCell>{entry.mood_value}</TableCell>
                                :
                                <>
                                <Drawer>
                                    <DrawerTrigger><TableCell>{entry.journal_title}</TableCell></DrawerTrigger>
                                    <DrawerContent>
                                        <DrawerHeader>
                                        <DrawerTitle className="text-2xl m-5">{entry.journal_title}</DrawerTitle>
                                        <DrawerDescription className="text-lg m-5"><ReactMarkdown>
                                            {entry.journal_summary}
                                            </ReactMarkdown></DrawerDescription>
                                        </DrawerHeader>
                                        <Accordion type="single" collapsible>
                                        <AccordionItem value="item-1" className="m-10 text-2xl">
                                            <AccordionTrigger>Raw Content</AccordionTrigger>
                                            <AccordionContent>
                                            {entry.journal_content}
                                            </AccordionContent>
                                        </AccordionItem>
                                        </Accordion>
                                        <DrawerFooter>
                                        <DrawerClose>
                                            <Button variant="outline">Nice!</Button>
                                        </DrawerClose>
                                        </DrawerFooter>
                                    </DrawerContent>
                                </Drawer>
                                </>
                            }
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>


    </div>
  )
}

export default Dashboard