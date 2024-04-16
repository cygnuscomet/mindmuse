'use client'

import {useState, useEffect} from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

const loginSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3, {
        message: "Username is too short",
    }).max(25, {
        message: "Username is too long!",
    }),
    password: z.string().min(8, {
        message: "Passwords need to be at least 8 characters long"
    })
})


import axios from 'axios'

const LoginPage = () => {
    const { toast } = useToast()
    const router = useRouter()

    const [registerToggleState, setRegisterToggleState] = useState({toggle: false, text: 'Login'})

    axios.defaults.xsrfCookieName = 'csrftoken'
    axios.defaults.xsrfHeaderName = 'X-CSRFToken'
    axios.defaults.withCredentials = true
    axios.defaults.withXSRFToken = true

    const client = axios.create({
        baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    })

    useEffect(() => {
        client.get("/api/user").then((response) => {
            router.refresh()
            router.push('/dashboard')
        }).catch((error) => {
            console.log(error)
        })
    })

    const loginForm = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            username: "",
            password: ""
        }
    })

    function onSubmit(values) {
        let retyped_password = document.getElementById('retyped_password').value
        if (values.password != retyped_password && registerToggleState.toggle) {
            console.log(values.password, retyped_password, registerToggleState.toggle)
            loginForm.setError("retyped_password", {
                type: "manual",
                message: "Passwords do not match"
            })
            return
        }

        if (registerToggleState.text.toLowerCase() === 'register') {
            client.post('/api/register', {
                email: values.email,
                password: values.password,
                username: values.username
            }).then((response) => {
                toast({
                    title: "Success",
                    description: 'You have successfully registered! Attempting login',
                    variant: 'success'
                })
                
                client.post('/api/login', {
                    email: values.email,
                    password: values.password,
                    username: values.username
                }).then((response) => {
                    toast({
                        title: "Success",
                        description: 'You have successfully logged in!',
                        variant: 'success'
                    })
                    router.push('/dashboard')
                }).catch((error) => {
                    toast({
                        title: error.toString(),
                        description: 'Failed to login',
                        variant: 'destructive'
                    })
                })

            }).catch((error) => {
                toast({
                    title: error.toString(),
                    description: 'Please try again with credentials that are not already in use.',
                    variant: 'destructive'
                })
            })
        }
        else {
            client.post('/api/login', {
                email: values.email,
                password: values.password,
                username: values.username
            }).then((response) => {
                toast({
                    title: "Success",
                    description: 'You have successfully logged in!',
                    variant: 'success'
                })
                router.push('/dashboard')
            }).catch((error) => {
                toast({
                    title: error.toString(),
                    description: 'Did you login with correct credentials?',
                    variant: 'destructive'
                })
            })
        }
    }

    return (
        <div className="flex flex-col items-center">
            <Form {...loginForm}>
                <h1 className="text-4xl font-semibold">{registerToggleState.text}</h1>
                <br />
                <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-8 w-2/5">
                    <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                <Input placeholder="HappyKitty24" {...field} />
                                </FormControl>
                                <FormDescription>
                                Your display name
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input type="email" placeholder="24kittens@example.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                We will never spam you.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                <Input id="retyped_password" type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {
                        registerToggleState.toggle ? (<FormField
                            control={loginForm.control}
                            name="retyped_password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Retype Password</FormLabel>
                                    <FormControl>
                                    <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />) : <></>
                    }

                    <div className='flex justify-between'>
                        
                        <div className='flex items-center gap-4 text-lg border-white font-bold p-2 rounded-md'> 
                            <span>New user?</span>
                            <Switch className='shadow-black shadow-sm' checked={registerToggleState.toggle} onCheckedChange={() => {
                            setRegisterToggleState({toggle: !registerToggleState.toggle, text: registerToggleState.toggle ? 'Login' : 'Register'})         
                        }}/>
                        </div>
                        <Button type="submit">{registerToggleState.text}</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
  }
  
export default LoginPage