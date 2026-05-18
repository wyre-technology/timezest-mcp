/**
 * Elicitation infrastructure for user input
 */
import { getServerRef } from './server-ref.js';
import { logger } from './logger.js';

export interface SelectionOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Elicit a selection from the user
 */
export async function elicitSelection(
  message: string,
  options: SelectionOption[]
): Promise<string | null> {
  try {
    const server = getServerRef();
    if (!server) {
      logger.warn('elicitSelection called but no server reference available');
      return null;
    }

    // Create options text
    const optionsText = options
      .map((opt, i) => `${i + 1}. ${opt.label}${opt.description ? ` - ${opt.description}` : ''}`)
      .join('\n');

    // For now, just return null - elicitation would be implemented based on server capabilities
    logger.debug('elicitSelection requested', { message, options: options.length });
    return null;
  } catch (error) {
    logger.error('elicitSelection failed', error);
    return null;
  }
}

/**
 * Elicit text input from the user
 */
export async function elicitText(
  message: string,
  placeholder?: string
): Promise<string | null> {
  try {
    const server = getServerRef();
    if (!server) {
      logger.warn('elicitText called but no server reference available');
      return null;
    }

    // For now, just return null - elicitation would be implemented based on server capabilities
    logger.debug('elicitText requested', { message, placeholder });
    return null;
  } catch (error) {
    logger.error('elicitText failed', error);
    return null;
  }
}

/**
 * Elicit confirmation from the user
 */
export async function elicitConfirmation(
  message: string,
  defaultValue = false
): Promise<boolean | null> {
  try {
    const server = getServerRef();
    if (!server) {
      logger.warn('elicitConfirmation called but no server reference available');
      return null;
    }

    // For now, just return null - elicitation would be implemented based on server capabilities
    logger.debug('elicitConfirmation requested', { message, defaultValue });
    return null;
  } catch (error) {
    logger.error('elicitConfirmation failed', error);
    return null;
  }
}