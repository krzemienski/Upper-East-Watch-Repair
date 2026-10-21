import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';

export function AccordionDemo() {
  return (
    <div className="max-w-lg rounded-xl border bg-card px-6">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It follows keyboard and screen-reader interaction patterns.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Can answers stay in the initial HTML?</AccordionTrigger>
          <AccordionContent forceMount>
            Yes. Force-mounted content stays in the document, but display: none
            keeps closed answers hidden and their controls out of keyboard navigation.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Can it be animated?</AccordionTrigger>
          <AccordionContent>
            Open and close states include motion-ready data attributes.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
