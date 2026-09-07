import type { Lesson } from './curriculum';
import type { Event as TraceEvent } from './simulation';
import { mountEngineeringStage } from './engineering-stage';
import { lessonStage, traceStage } from './lesson-stages';

export function mountLessonTheater(host: HTMLElement, initial: Lesson) {
  let lesson = initial, section: 'essentials' | 'deep' | 'check' = 'essentials', subsection = 0;
  const stage = mountEngineeringStage(host, lessonStage(lesson, section, subsection));
  return {
    update(value: Lesson) { lesson = value; section = 'essentials'; subsection = 0; stage.update(lessonStage(lesson, section, subsection)); },
    setSection(value: 'essentials' | 'deep' | 'check', index = 0) { if (section === value && subsection === index) return; section = value; subsection = index; stage.update(lessonStage(lesson, section, subsection)); },
    pause: stage.pause,
    dispose: stage.dispose,
  };
}
export function mountTraceTheater(host: HTMLElement) {
  const stage = mountEngineeringStage(host, traceStage([], 'injection'), false, true);
  return { update(events: TraceEvent[], scenario: string) { const spec = traceStage(events, scenario); stage.update(spec, spec.frames.length - 1); }, pause: stage.pause, dispose: stage.dispose };
}
