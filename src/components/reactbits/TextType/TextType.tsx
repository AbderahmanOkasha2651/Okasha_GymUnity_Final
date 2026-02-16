import React, {
    useEffect,
    useRef,
    useState,
    createElement,
    useMemo,
    useCallback,
} from 'react';
import { gsap } from 'gsap';
import './TextType.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VariableSpeed {
    min: number;
    max: number;
}

interface TextTypeProps extends React.HTMLAttributes<HTMLElement> {
    /** Single string or array of strings to cycle through */
    text: string | string[];
    /** HTML element tag to render as */
    as?: React.ElementType;
    /** Speed (ms) per character when typing */
    typingSpeed?: number;
    /** Delay (ms) before first typing starts */
    initialDelay?: number;
    /** Pause (ms) between deleting and next phrase */
    pauseDuration?: number;
    /** Speed (ms) per character when deleting */
    deletingSpeed?: number;
    /** Loop through phrases continuously */
    loop?: boolean;
    /** Show blinking cursor */
    showCursor?: boolean;
    /** Hide cursor while actively typing */
    hideCursorWhileTyping?: boolean;
    /** Character used as cursor */
    cursorCharacter?: string;
    /** Extra CSS class for cursor */
    cursorClassName?: string;
    /** Cursor blink GSAP duration */
    cursorBlinkDuration?: number;
    /** Per-phrase text colors (falls back to 'inherit') */
    textColors?: string[];
    /** Randomise typing speed within range */
    variableSpeed?: VariableSpeed;
    /** Callback after a phrase finishes typing */
    onSentenceComplete?: (sentence: string, index: number) => void;
    /** Defer animation until element scrolls into view */
    startOnVisible?: boolean;
    /** Type characters in reverse order */
    reverseMode?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const TextType: React.FC<TextTypeProps> = ({
    text,
    as: Component = 'div',
    typingSpeed = 50,
    initialDelay = 0,
    pauseDuration = 2000,
    deletingSpeed = 30,
    loop = true,
    className = '',
    showCursor = true,
    hideCursorWhileTyping = false,
    cursorCharacter = '|',
    cursorClassName = '',
    cursorBlinkDuration = 0.5,
    textColors = [],
    variableSpeed,
    onSentenceComplete,
    startOnVisible = false,
    reverseMode = false,
    ...props
}) => {
    /* Check reduced-motion preference */
    const prefersReducedMotion = useMemo(
        () =>
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        [],
    );

    const textArray = useMemo(
        () => (Array.isArray(text) ? text : [text]),
        [text],
    );

    /* If reduced-motion, render the first phrase statically */
    if (prefersReducedMotion) {
        return createElement(
            Component,
            { className: `rb-text-type ${className}`, ...props },
            <span style={{ color: textColors[0] || 'inherit' }}>{textArray[0]}</span>,
        );
    }

    return (
        <TextTypeInner
            text={text}
            as={Component}
            typingSpeed={typingSpeed}
            initialDelay={initialDelay}
            pauseDuration={pauseDuration}
            deletingSpeed={deletingSpeed}
            loop={loop}
            className={className}
            showCursor={showCursor}
            hideCursorWhileTyping={hideCursorWhileTyping}
            cursorCharacter={cursorCharacter}
            cursorClassName={cursorClassName}
            cursorBlinkDuration={cursorBlinkDuration}
            textColors={textColors}
            variableSpeed={variableSpeed}
            onSentenceComplete={onSentenceComplete}
            startOnVisible={startOnVisible}
            reverseMode={reverseMode}
            {...props}
        />
    );
};

/* ------------------------------------------------------------------ */
/*  Inner animated component                                           */
/* ------------------------------------------------------------------ */

const TextTypeInner: React.FC<TextTypeProps> = ({
    text,
    as: Component = 'div',
    typingSpeed = 50,
    initialDelay = 0,
    pauseDuration = 2000,
    deletingSpeed = 30,
    loop = true,
    className = '',
    showCursor = true,
    hideCursorWhileTyping = false,
    cursorCharacter = '|',
    cursorClassName = '',
    cursorBlinkDuration = 0.5,
    textColors = [],
    variableSpeed,
    onSentenceComplete,
    startOnVisible = false,
    reverseMode = false,
    ...props
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(!startOnVisible);
    const cursorRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLElement>(null);

    const textArray = useMemo(
        () => (Array.isArray(text) ? text : [text]),
        [text],
    );

    const getRandomSpeed = useCallback(() => {
        if (!variableSpeed) return typingSpeed;
        const { min, max } = variableSpeed;
        return Math.random() * (max - min) + min;
    }, [variableSpeed, typingSpeed]);

    const getCurrentTextColor = () => {
        if (textColors.length === 0) return 'inherit';
        return textColors[currentTextIndex % textColors.length];
    };

    useEffect(() => {
        if (!startOnVisible || !containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setIsVisible(true);
                });
            },
            { threshold: 0.1 },
        );

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [startOnVisible]);

    useEffect(() => {
        if (showCursor && cursorRef.current) {
            gsap.set(cursorRef.current, { opacity: 1 });
            gsap.to(cursorRef.current, {
                opacity: 0,
                duration: cursorBlinkDuration,
                repeat: -1,
                yoyo: true,
                ease: 'power2.inOut',
            });
        }
    }, [showCursor, cursorBlinkDuration]);

    useEffect(() => {
        if (!isVisible) return;

        let timeout: ReturnType<typeof setTimeout>;
        const currentText = textArray[currentTextIndex];
        const processedText = reverseMode
            ? currentText.split('').reverse().join('')
            : currentText;

        const executeTypingAnimation = () => {
            if (isDeleting) {
                if (displayedText === '') {
                    setIsDeleting(false);
                    if (currentTextIndex === textArray.length - 1 && !loop) return;
                    onSentenceComplete?.(textArray[currentTextIndex], currentTextIndex);
                    setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
                    setCurrentCharIndex(0);
                    timeout = setTimeout(() => { }, pauseDuration);
                } else {
                    timeout = setTimeout(() => {
                        setDisplayedText((prev) => prev.slice(0, -1));
                    }, deletingSpeed);
                }
            } else {
                if (currentCharIndex < processedText.length) {
                    timeout = setTimeout(
                        () => {
                            setDisplayedText((prev) => prev + processedText[currentCharIndex]);
                            setCurrentCharIndex((prev) => prev + 1);
                        },
                        variableSpeed ? getRandomSpeed() : typingSpeed,
                    );
                } else if (textArray.length >= 1) {
                    if (!loop && currentTextIndex === textArray.length - 1) return;
                    timeout = setTimeout(() => {
                        setIsDeleting(true);
                    }, pauseDuration);
                }
            }
        };

        if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
            timeout = setTimeout(executeTypingAnimation, initialDelay);
        } else {
            executeTypingAnimation();
        }

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentCharIndex,
        displayedText,
        isDeleting,
        typingSpeed,
        deletingSpeed,
        pauseDuration,
        textArray,
        currentTextIndex,
        loop,
        initialDelay,
        isVisible,
        reverseMode,
        variableSpeed,
        onSentenceComplete,
    ]);

    const shouldHideCursor =
        hideCursorWhileTyping &&
        (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

    return createElement(
        Component,
        {
            ref: containerRef,
            className: `rb-text-type ${className}`,
            'aria-label': textArray.join(', '),
            ...props,
        },
        <span className="rb-text-type__content" style={{ color: getCurrentTextColor() }}>
            {displayedText}
        </span>,
        showCursor && (
            <span
                ref={cursorRef}
                className={`rb-text-type__cursor ${cursorClassName} ${shouldHideCursor ? 'rb-text-type__cursor--hidden' : ''}`}
            >
                {cursorCharacter}
            </span>
        ),
    );
};

export default TextType;
