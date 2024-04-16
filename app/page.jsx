import { buttonVariants } from "@components/ui/button"
import Link from 'next/link'

const Home = () => {
  return (
    <>
    <div className="flex flex-col items-center">
    <div className="text-center text-6xl mb-10">Discover a new you.</div>
    <div className="text-center text-2xl"><span>MindMuse</span> is a platform for AI-assisted journaling and self-reflection.</div>
    <Link href="/login" className={`${buttonVariants({ variant: "secondary" })} mt-10 bg-green-500 text-gray-900`} >
        <p className='font-semibold'>Get Started</p>
    </Link>
    </div>

    <div className="text-4xl mt-12 ml-4">Our approach</div>
    <div className="text-xl mt-6 ml-4">
      Traditional journaling often falls short when it comes to providing personalized guidance and support. That's where we step in. Mindful Journals harnesses the power of AI to offer tailored journaling experiences, mood tracking, and personalized music recommendations, all in one intuitive platform.
    </div>

    <div className="text-4xl mt-24 ml-4">Journaling Made Easy</div>
    <div className="text-xl mt-6 ml-4">
      Say goodbye to inconsistent journaling habits. With our on-the-go journaling feature, you can capture your thoughts, emotions, and experiences anytime, anywhere. Our user-friendly interface makes it effortless to engage in regular self-reflection and document your mental states.
    </div>

    <div className="text-4xl mt-24 ml-4">Guided Self-Exploration</div>
    <div className="text-xl mt-6 ml-4">
      Unlock deeper insights into your inner world with our assistive journaling sessions. Powered by Large Language Models (LLMs), our AI guides you through introspective exercises and prompts, empowering you to explore your thoughts and emotions with clarity and purpose.
    </div>

    <div className="text-4xl mt-24 ml-4">Track Your Progress</div>
    <div className="text-xl mt-6 ml-4">
      Understanding your emotional patterns is key to fostering growth and resilience. With our mood tracking feature, you can effortlessly log your emotional states at any time or date. Gain valuable insights into your mood fluctuations over time and discover potential correlations with external factors.
    </div>

    </>
  )
}

export default Home