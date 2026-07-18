import { useState } from "react";
import toast from "react-hot-toast";
import { getSession } from "../api/auth";

/**
 * Shared state + handlers for the manual "Receive document" confirmation flow
 * used across the Provincial Administrator, Budget and Governor pages.
 *
 * @param {object}   config
 * @param {Function} config.receiveFn        API call: (id, receiverName) => Promise<doc>.
 * @param {Function} config.onReceived       Called with the updated document on success.
 * @param {Function} [config.successMessage] Builds the success toast: (doc) => string.
 */
export const useReceiveFlow = ({ receiveFn, onReceived, successMessage }) => {
  const [target, setTarget] = useState(null);
  const [receiverName, setReceiverName] = useState("");
  const [receivingId, setReceivingId] = useState(null);

  const open = (doc) => {
    setReceiverName(getSession()?.fullName || "");
    setTarget(doc);
  };

  const close = () => {
    if (receivingId) return;
    setTarget(null);
    setReceiverName("");
  };

  const confirm = async (event) => {
    event?.preventDefault();
    if (!target) return;

    const name = receiverName.trim();
    if (!name) {
      toast.error("Please enter who received the document.");
      return;
    }

    setReceivingId(target.id);
    try {
      const updated = await receiveFn(target.id, name);
      toast.success(
        successMessage
          ? successMessage(updated)
          : `Received by ${updated.receivedByName}`,
      );
      onReceived?.(updated);
      setTarget(null);
      setReceiverName("");
    } catch (err) {
      toast.error(err.message || "Failed to receive document.");
    } finally {
      setReceivingId(null);
    }
  };

  return {
    target,
    receiverName,
    setReceiverName,
    open,
    close,
    confirm,
    submitting: Boolean(receivingId),
    isReceiving: (id) => receivingId === id,
  };
};
