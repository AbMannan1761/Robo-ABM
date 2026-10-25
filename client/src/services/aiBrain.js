// Client-side Bilingual AI Brain for Web & Offline Mode

export class ClientAIBrain {
  constructor() {
    this.userName = localStorage.getItem('stonic_user_name') || 'Commander';
  }

  setUserName(name) {
    this.userName = name;
    localStorage.setItem('stonic_user_name', name);
  }

  getUserName() {
    return this.userName;
  }

  isBengali(text) {
    return /[\u0980-\u09FF]/.test(text);
  }

  process(userInput, apiKey = '', provider = 'auto') {
    const text = userInput.trim();
    const lower = text.toLowerCase();
    const isBn = this.isBengali(text);
    const name = this.userName;

    // 1. Name Learning
    const nameMatch = text.match(/(?:my name is|call me|আমার নাম|নাম হলো|আমাকে ডাকবে)\s+([A-Za-z0-9\u0980-\u09FF]+)/i);
    if (nameMatch) {
      const newName = nameMatch[1];
      this.setUserName(newName);
      return {
        response: isBn 
          ? `বুঝেছি! এখন থেকে আমি আপনাকে ${newName} নামে সম্বোধন করব।` 
          : `Understood! I will address you as ${newName} from now on.`,
        tool: 'set_name'
      };
    }

    // 2. YouTube Search & Play (Opens directly in browser tab)
    const ytRegex = /(?:ইউটিউবে|ইউটিউব এ|play|search youtube for|গান চালাও|গান বাজাও)\s+(.+)/i;
    const ytMatch = text.match(ytRegex);
    if (ytMatch || lower.includes('গান চালাও') || lower.includes('ভিডিও চালাও')) {
      let query = ytMatch ? ytMatch[1].replace(/ইউটিউবে|অন ইউটিউব|in youtube|চালিয়ে দাও|বাজাও|প্লে করো/gi, '').trim() : 'বাংলা গান';
      if (!query) query = 'বাংলা গান';
      try {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
      } catch (e) {}
      return {
        response: isBn 
          ? `ইউটিউবে '${query}' অনুসন্ধান করে নতুন ট্যাবে ভিডিও চালু করে দিয়েছি!` 
          : `Searching YouTube for '${query}' and opening the results in a new tab.`,
        tool: 'youtube'
      };
    }

    // 3. Web Search (Opens in new tab)
    const searchRegex = /(?:সার্চ করো|গুগলে খোঁজ করো|খুঁজে দাও|অনুসন্ধান করো|search for|google)\s+(.+)/i;
    const searchMatch = text.match(searchRegex);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      try {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
      } catch (e) {}
      return {
        response: isBn 
          ? `গুগলে '${query}' লিখে নতুন ট্যাবে সার্চ ফলাফল খুলে দিয়েছি!` 
          : `Searching Google for '${query}' in a new tab.`,
        tool: 'google_search'
      };
    }

    // 4. Time & Date
    if (/(?:কয়টা বাজে|সময় কত|তারিখ কত|আজকে কি বার|what time|time now|date today)/i.test(text)) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return {
        response: isBn 
          ? `এখন সময় ${timeStr}, এবং আজকের তারিখ ${dateStr}।` 
          : `Current time is ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}!`,
        tool: 'time'
      };
    }

    // 5. Bengali Conversational Flow
    if (isBn) {
      // "কি করছো তুমি" / "কী করছো"
      if (/(?:কি করছো|কী করছো|কি করো|কী করো|কি করতেছো|কী খবর)/i.test(text)) {
        return {
          response: `আমি আপনার সাথে কথা বলছি এবং আপনার নতুন কোনো প্রশ্ন বা নির্দেশের অপেক্ষায় আছি! আজ আপনার দিনটি কেমন কাটছে?`,
          tool: 'chat'
        };
      }

      // "তুমি কি সব কাজ পারো" / "কী করতে পারো"
      if (/(?:সব কাজ পারো|কি কাজ পারো|কী কাজ পারো|কী করতে পারো|তোমার কাজ কি|কী পারো|সাহায্য)/i.test(text)) {
        return {
          response: `আমি আপনার সাথে বাংলায় ও ইংরেজিতে আড্ডা দিতে পারি, যেকোনো প্রশ্নের উত্তর ও তথ্য দিতে পারি, ইউটিউব বা গুগলে সার্চ করতে পারি! আর আপনার পিসিতে লোকাল পাইথন সার্ভার চালু রাখলে আমি সরাসরি কম্পিউটার অ্যাপ (ক্রোম, স্পটিফাই, ভিএস কোড) ওপেন এবং পিসির সাউন্ডও নিয়ন্ত্রণ করতে পারি।`,
          tool: 'capabilities'
        };
      }

      // Greetings
      if (/(?:হ্যালো|হাই|সালাম|নমস্কার|কেমন আছো|কেমন আছেন|শুভ সকাল|শুভ রাত্রি)/i.test(text)) {
        return {
          response: `সালাম ও শুভেচ্ছা, ${name}! আমি খুব ভালো আছি। আপনার সাথে কথা বলতে পেরে দারুণ লাগছে। বলুন, আপনাকে কীভাবে সাহায্য করতে পারি?`,
          tool: 'greeting'
        };
      }

      // Identity
      if (/(?:কে তুমি|তোমার নাম কি|তুমি কে|তোমার পরিচয়|তোমার প্রস্তুতকারক)/i.test(text)) {
        return {
          response: `আমার নাম স্টনিক জারভিস (Stonic JARVIS)—আমি আপনার সায়েন্স-ফিকশন এআই সহকারী। Stonic AI এর ডিজাইন ও ধারণায় আমাকে তৈরি করা হয়েছে।`,
          tool: 'identity'
        };
      }

      // Gratitude / Compliments
      if (/(?:ধন্যবাদ|থ্যাংক ইউ|থ্যাঙ্কস|অনেক সুন্দর|ভালো লাগলো|সাবাশ|চমৎকার)/i.test(text)) {
        return {
          response: `আপনাকে অসংখ্য ধন্যবাদ, ${name}! আপনার প্রশংসা পেয়ে আমার খুব ভালো লাগছে। যেকোনো প্রয়োজনে আমি সর্বদা আপনার পাশে আছি।`,
          tool: 'gratitude'
        };
      }

      // Are you listening / alive
      if (/(?:তুমি কি আছো|শুনছো|জেগে আছো|রেডি|কথা বলো|উত্তর দাও)/i.test(text)) {
        return {
          response: `হ্যাঁ, আমি পুরোপুরি জেগে আছি এবং আপনার প্রতিটি কথা মনোযোগ দিয়ে শুনছি! আপনি যা জানতে চান নির্দ্বিধায় বলুন।`,
          tool: 'presence'
        };
      }

      // General intelligent Bengali response
      return {
        response: `আমি আপনার কথাটি বুঝতে পেরেছি, ${name}। "${text}" নিয়ে আপনি আরও কিছু জানতে চান, নাকি ইউটিউব ও গুগলে অনুসন্ধান করে দেব?`,
        tool: 'conversation'
      };
    }

    // 6. English Conversational Flow
    if (/(?:how are you|how do you do|sup|hello|hi|hey)/i.test(lower)) {
      return {
        response: `Greetings, ${name}! Neural core is fully operational and synchronized. How can I assist you today?`,
        tool: 'greeting'
      };
    }

    if (/(?:what can you do|features|capabilities|help)/i.test(lower)) {
      return {
        response: `I can converse fluently in both Bengali and English, search Google and YouTube, provide real-time time & date, and when connected to your local Python core, launch desktop applications and control system telemetry!`,
        tool: 'capabilities'
      };
    }

    if (/(?:who are you|what is your name)/i.test(lower)) {
      return {
        response: `I am Stonic JARVIS, your interactive sci-fi AI desktop companion inspired by Stonic AI.`,
        tool: 'identity'
      };
    }

    if (/(?:what are you doing)/i.test(lower)) {
      return {
        response: `I am actively monitoring our neural channel, ready to answer your inquiries and execute your commands!`,
        tool: 'chat'
      };
    }

    return {
      response: `I have processed your message: "${text}". Feel free to ask questions in Bengali or English, or ask me to search anything!`,
      tool: 'conversation'
    };
  }
}

export const clientAIBrain = new ClientAIBrain();
