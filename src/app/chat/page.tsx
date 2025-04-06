"use client"
import React, { Fragment, startTransition, useEffect, useRef, useState, useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AskAIAction, GenerateAIResponse, GetModels } from '@/lib/apiservice';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModeToggle } from '@/components/theme-toggle';
import { ArrowUpIcon } from 'lucide-react';


interface Message {
  message: string;
  isUser: boolean;
}



export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [ispending, startTransition] = useTransition();
  var [messages, setMessages] = React.useState<Array<Message>>([]);
  var [input, setInput] = React.useState("");
  var [model, setModel] = React.useState("deepseek-r1:1.5b");
  var [modelsList, setModelsList] = React.useState<Array<string>>([]);
  var [ismodelSelected, setIsModelSelected] = React.useState(false);

  const [questionText, setQuestionText] = React.useState("");
  const [questions, setQuestions] = React.useState<string[]>([]);
  const [responses, setResponses] = React.useState<string[]>([]);
  const [file, setFile] = useState(null);

  const handleFileChange = (event: any) => {
    console.log(event.target.files);
    setFile(event.target.files);
  };
 

  const handleSubmit = () => {
    if(!questionText.trim()) return;

    const newQuestions = [...questions, questionText];
    setQuestions(newQuestions);
    setQuestionText("");
    setTimeout(scrollToBottom, 100);

    startTransition(async () =>  {
      const msgs = await AskAIAction(newQuestions, responses);
      console.log(msgs);
      GenerateAIResponse(msgs, model).then(async (resp: any) => {
        console.log(resp);
        setResponses((prev) => [...prev, resp.data.message.content]);
        setTimeout(scrollToBottom, 100);
        });
      
    });

}
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }
  
  const handleInput = () =>{
    const textarea = textareaRef.current;
    if(!textarea) return;
  
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
  const handleClickInput = () => {
    textareaRef.current?.focus();
  }

  useEffect(() => {
    GetModels().then((resp: any) => {
      var models = resp.data.models;
      setModelsList(models.map((item: any) => item.name));
    });
  }, [modelsList, setModelsList]);

  return (
    <div className="grid w-full gap-2 items-center">
      <div className='flex flex-row m-4'>
      <ModeToggle />
      <div>
      <Select onValueChange={(value) => {
        setModel(value);
        setIsModelSelected(true);
        }}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a Model" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {modelsList.map((model, index) => {
            return (
              <SelectItem key={index} value={model}>{model}</SelectItem>
            )
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
    </div>   
      </div>
    
     
      <div className='flex flex-col h-[70vh] w-[90vw] overflow-y-scroll m-5' ref={messagesEndRef} hidden={!ismodelSelected && questions.length == 0}>
            {questions.map((question, index) => (
                  <Fragment key={index}>
                    <p className="bg-muted text-muted-foreground ml-auto max-w-[60%] rounded-md px-2 py-1 text-sm">
                      {question}
                    </p>
                    {responses[index] && (
                      <p
                        className="bot-response text-muted-foreground text-sm"
                        dangerouslySetInnerHTML={{ __html: responses[index] }}
                      />
                    )}
                  </Fragment>
                ))}
              {ispending && <p className='animate-pulse text-sm'>Thinking...</p>}
              
            </div>
        
      <div className="absolute bottom-0 flex justify-center items-center w-[-webkit-fill-available] m-[20px]">

      <div className='mt-auto flex cursor-text flex-row rounded-lg border p-4 w-full'
        onClick={handleClickInput} hidden={!ismodelSelected}>
          <Textarea 
          ref={textareaRef}
          placeholder='Ask me anything...'
          className='bg-transparent placeholder:text-muted-foreground resize-none rounded-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
          style={{
            minHeight:"0",
            lineHeight: "normal",
            backgroundColor: "transparent",
          }}
          rows={1}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          />
          <Input id="picture" type="file" onChange={handleFileChange} />

          <Button className='ml-auto size-8 rounded-full' onClick={handleClickInput}>
            <ArrowUpIcon className="text-background" />
          </Button>
        </div>
      {/* <Input type="text" value={input} disabled={!ismodelSelected} onKeyDown={handleKeypress} onChange={handleKeypress} placeholder="Type your message here...and press enter" /> */}
      </div>
  </div>
  )
}