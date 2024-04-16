'use client';

import Link from 'next/link'
import Image from 'next/image'

import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'

import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
  

import {useState, useEffect} from 'react'
import axios from 'axios'


axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.withXSRFToken = true

const client = axios.create({
    withCredentials: true,
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withXSRFToken: true
})

const Nav = () => {

    const { toast } = useToast()
    const router = useRouter()
    const [isUserLoggedIn, setIsUserLoggedIn] = useState()

    useEffect(() => {
        client.get("/api/user").then((response) => {
            setIsUserLoggedIn(true)
        }).catch((error) => {
            setIsUserLoggedIn(false)
        })
    })
    
    return (
        <>
        <nav className='flex m-5 mx-12 mt-0 pt-8 flex-row items-center gap-5 justify-between'>
            <Link href='/' className='flex gap-2 items-center'>
                    <Image src='/assets/logo.svg' width={50} height={50} alt='MindMuse Logo' className='object-contain'/>
                    <p className='font-extrabold text-2xl'>MindMuse</p>
            </Link>
            <div className="sm:flex hidden">

                {
                isUserLoggedIn ?
                    (
                        <>
                        <Link href='/dashboard' className={`${buttonVariants({ variant: "outline" })}flex-center items-center mx-4`}>
                                <p className='font-semibold'>Dashboard</p>
                        </Link>
                        

                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <Avatar>
                                    <AvatarImage src="assets/profile-circle.png" />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='bg-black'>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    client.post("/api/logout").then((response) => {
                                        setIsUserLoggedIn(false)
                                        toast({
                                            title: 'Success!',
                                            description: 'You have been logged out',
                                            variant: 'success'
                                        })
                                        router.push('/')
                                    }).catch((error) => {
                                        toast({
                                            title: error.toString(),
                                            description: 'Please try logging out again later',
                                            variant: 'destructive'
                                        })
                                    })
                                }}> Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        

                        </>
                    ) : 
                    (
                        <div className='flex gap-3 md:gap-5'>
                            <Link href='/login' className={`${buttonVariants({ variant: "outline" })}flex-center items-center`}>
                                <p className='font-semibold'>Get Started</p>
                            </Link>
                        </div>
                    )
                }

                
            </div>
        </nav>
        
        <Separator className="mb-16 w-4/5 mx-auto"/>
        </>
    )
}

export default Nav