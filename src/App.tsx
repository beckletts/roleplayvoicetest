import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { VoiceService } from './services/voiceService';
import { ConversationService } from './services/conversationService';

const AppContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Arial', sans-serif;
`;

const ChatContainer = styled.div`
  background: #f5f5f5;
  border-radius: 10px;
  padding: 2rem;
  margin-bottom: 2rem;
  min-height: 400px;
  overflow-y: auto;
`;

const CustomerInfo = styled.div`
  background: #e9ecef;
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  color: #6c757d;
`;

const InfoValue = styled.span`
  font-weight: bold;
  color: #495057;
`;

const EmotionIndicator = styled.div<{ emotion?: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => 
    props.emotion === 'frustrated' ? '#dc3545' :
    props.emotion === 'anxious' ? '#ffc107' :
    props.emotion === 'confused' ? '#17a2b8' :
    props.emotion === 'satisfied' ? '#28a745' :
    '#6c757d'
  };
  margin-right: 0.5rem;
`;

const Message = styled.div<{ isUser?: boolean; emotion?: string }>`
  background: ${props => props.isUser ? '#007bff' : '#ffffff'};
  color: ${props => props.isUser ? '#ffffff' : '#000000'};
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  max-width: 80%;
  margin-left: ${props => props.isUser ? 'auto' : '0'};
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const MessageContent = styled.div`
  flex: 1;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 1rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }
`;

const MicButton = styled(Button)<{ isListening: boolean }>`
  background: ${props => props.isListening ? '#dc3545' : '#28a745'};
  
  &:hover {
    background: ${props => props.isListening ? '#c82333' : '#218838'};
  }
`;

const TipsContainer = styled.div`
  background: #e9ecef;
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
`;

const TipsTitle = styled.h3`
  margin-top: 0;
  color: #495057;
`;

const TipsList = styled.ul`
  padding-left: 1.5rem;
  margin-bottom: 0;
`;

const TipItem = styled.li`
  margin-bottom: 0.5rem;
  color: #495057;
`;

interface Message {
  text: string;
  isUser: boolean;
  emotion?: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('frustrated');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const voiceService = useRef<VoiceService>(new VoiceService());
  const conversationService = useRef<ConversationService>(new ConversationService());

  useEffect(() => {
    // Initial message from customer
    const initialMessage: Message = {
      text: conversationService.current.getInitialMessage(),
      isUser: false,
      emotion: 'frustrated'
    };
    setMessages([initialMessage]);
    setCurrentEmotion('frustrated');
    voiceService.current.speak(initialMessage.text, 'frustrated');
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      text: inputValue,
      isUser: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    // Get response from customer
    setTimeout(() => {
      const responseText = conversationService.current.getResponse(inputValue);
      const emotion = responseText.includes('thank you') ? 'satisfied' : 
                     responseText.includes('not sure') ? 'frustrated' :
                     responseText.includes('worried') ? 'anxious' :
                     responseText.includes('understand') ? 'confused' :
                     currentEmotion;
      
      setCurrentEmotion(emotion);
      
      const response: Message = {
        text: responseText,
        isUser: false,
        emotion: emotion
      };
      setMessages(prev => [...prev, response]);
      voiceService.current.speak(response.text, emotion);
    }, 1000);
  };

  const toggleListening = () => {
    if (isListening) {
      voiceService.current.stopListening();
      setIsListening(false);
    } else {
      voiceService.current.startListening((text) => {
        setInputValue(text);
        setIsListening(false);
      });
      setIsListening(true);
    }
  };

  const customerDetails = conversationService.current.getCustomerDetails();

  return (
    <AppContainer>
      <h1>Customer Support Role Play</h1>
      <CustomerInfo>
        <InfoItem>
          <InfoLabel>Customer Name</InfoLabel>
          <InfoValue>{customerDetails.name}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Student ID</InfoLabel>
          <InfoValue>{customerDetails.studentId}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Center Number</InfoLabel>
          <InfoValue>{customerDetails.centerNumber}</InfoValue>
        </InfoItem>
        <EmotionIndicator emotion={currentEmotion} title={currentEmotion} />
      </CustomerInfo>
      <TipsContainer>
        <TipsTitle>Customer Support Tips:</TipsTitle>
        <TipsList>
          <TipItem>Start by acknowledging the customer's issue</TipItem>
          <TipItem>Use empathetic language</TipItem>
          <TipItem>Ask clarifying questions when needed</TipItem>
          <TipItem>Provide clear, step-by-step solutions</TipItem>
          <TipItem>Confirm understanding before proceeding</TipItem>
        </TipsList>
      </TipsContainer>
      <ChatContainer ref={chatContainerRef}>
        {messages.map((message, index) => (
          <Message key={index} isUser={message.isUser} emotion={message.emotion}>
            {!message.isUser && <EmotionIndicator emotion={message.emotion} />}
            <MessageContent>{message.text}</MessageContent>
          </Message>
        ))}
      </ChatContainer>
      <form onSubmit={handleSubmit}>
        <InputContainer>
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your response as a customer support agent..."
          />
          <MicButton
            type="button"
            onClick={toggleListening}
            isListening={isListening}
          >
            {isListening ? 'Stop' : 'Mic'}
          </MicButton>
          <Button type="submit">Send</Button>
        </InputContainer>
      </form>
    </AppContainer>
  );
};

export default App; 