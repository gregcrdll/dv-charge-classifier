import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DVChargeClassifier() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [explanation, setExplanation] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [referenceType, setReferenceType] = useState("");

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Your browser does not support voice recognition. Please use Chrome on desktop or mobile.");
    }
  }, []);

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) return;

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setRecognizing(true);
    recognition.onend = () => setRecognizing(false);

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setDescription(speechResult);
    };

    recognition.start();
  };

  const classifyDV = (desc) => {
    const text = desc.toLowerCase();

    const physicalMinor = /(slap|push|grab|shove|poke|smack|flick|tap|pinch)/.test(text);
    const physicalMajor = /(punch|kick|choked|struck|headbutt|body slam|tackle|elbowed|kneed|bit|burned|cut|hit with object|threw down stairs)/.test(text);

    const threatLow = /(threaten(ed)? to slap|hit)/.test(text);
    const threatModerate = /(threaten(ed)? to harm|hurt|beat|break something)/.test(text);
    const threatHigh = /(threaten(ed)? to kill|shoot|stab|burn|strangle|blow up|murder)/.test(text);

    const weapon = /(gun|knife|bat|weapon|firearm|sword|crowbar|machete)/.test(text);
    const priorDV = /(prior dv|previous conviction|history of dv)/.test(text);
    const minor = /(child|minor)/.test(text);
    const pregnant = /(pregnant)/.test(text);
    const protection = /(protection order|restraining order)/.test(text);
    const blocked = /(blocked|took phone|911|prevented call)/.test(text);

    const greatInjury = /(broke (arm|leg|rib|nose|jaw)|fractured|great injury|serious injury|hospitalized|lost tooth|disfigured|loss of function|internal bleeding|brain injury|stab wound|gunshot|coma)/.test(text);
    const moderateInjury = /(concussion|swollen eye|deep bruises|black eye|sprain|minor fracture|stitches|mild bleeding)/.test(text);
    const extremeIndifference = /(ran over|threw off|pushed into traffic|set on fire|smashed head|beat unconscious)/.test(text);

    const aggravators = [weapon, priorDV, minor, pregnant, protection, blocked].filter(Boolean).length;

    let charge = "";
    let reason = "";

    if (greatInjury && (protection || weapon || extremeIndifference)) {
      charge = "DVHAN";
      reason = "Great bodily injury occurred with extreme indifference, weapon use, or violation of a protection order.";
    } else if (greatInjury || (extremeIndifference && aggravators >= 1)) {
      charge = "DV 1st Degree";
      reason = "Great bodily injury or extreme indifference with aggravators (e.g., weapon or prior DV).";
    } else if (physicalMajor && (weapon || protection || priorDV || moderateInjury)) {
      charge = "DV 1st Degree";
      reason = "Major force used with moderate injury or aggravators like a weapon, prior DV, or protection order.";
    } else if ((threatHigh && aggravators >= 1) || (physicalMinor && aggravators >= 2)) {
      charge = "DV 1st Degree";
      reason = "High-level threat or minor contact with multiple aggravating factors.";
    } else if (moderateInjury || physicalMajor || threatModerate || blocked || aggravators >= 1) {
      charge = "DV 2nd Degree";
      reason = "Moderate injury, moderate-level threat or force, or one major aggravator like blocking 911 or prior DV.";
    } else if (physicalMinor || threatLow) {
      charge = "DV 3rd Degree";
      reason = "Minor contact or low-level verbal threat with no aggravating conditions.";
    } else {
      charge = "Does not meet DV criteria";
      reason = "No qualifying act, injury, or threat detected under SC DV law.";
    }

    setResult(charge);
    setExplanation(reason);
  };

  const handleClassify = () => {
    classifyDV(description);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border border-gray-300">
          <CardContent className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-center text-blue-800">SC DV Charge Classifier</h1>
            <p className="text-md text-gray-700 text-center">
              Enter or speak a description of the incident. This tool uses SC law to determine the appropriate Domestic Violence charge.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Threatened to shoot and blocked 911 call"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-base border-gray-400"
              />
              <Button onClick={startVoiceInput}>{recognizing ? "Listening..." : "🎤 Speak"}</Button>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleClassify}>Classify</Button>
            </div>
            {result && (
              <div className="text-center border-t pt-4">
                <div className="text-xl font-bold text-green-700 mb-2">
                  Recommended Charge: {result}
                </div>
                <p className="text-sm text-gray-700">{explanation}</p>
              </div>
            )}
            <div className="pt-6 border-t">
              <h2 className="text-md font-semibold text-gray-700 mb-1">Reference Guide</h2>
              <Select onValueChange={setReferenceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Reference Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderate">Moderate Injury Examples</SelectItem>
                  <SelectItem value="great">Great Bodily Injury Examples</SelectItem>
                  <SelectItem value="indifference">Extreme Indifference Examples</SelectItem>
                </SelectContent>
              </Select>
              {referenceType === "moderate" && <p className="mt-2 text-sm text-gray-600">Examples: Concussion, swollen eye, black eye, deep bruises, minor fracture, stitches, sprain</p>}
              {referenceType === "great" && <p className="mt-2 text-sm text-gray-600">Examples: Broken bones, lost tooth, internal bleeding, coma, disfigurement, gunshot, stab wound, brain injury</p>}
              {referenceType === "indifference" && <p className="mt-2 text-sm text-gray-600">Examples: Threw into traffic, ran over, set on fire, smashed head, beat unconscious</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
