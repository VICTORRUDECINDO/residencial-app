'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Lock, AlertCircle, RefreshCw, CheckCircle, Mail, Key } from 'lucide-react';

export default function LockScreen() {
  const { unlock, recoveryEmail, storedPin } = useAuth();
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Recovery States
  const [isRecovering, setIsRecovering] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Focus first input on mount
  useEffect(() => {
    if (!isRecovering) {
      inputRefs.current[0]?.focus();
    }
  }, [isRecovering]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newPinArray = [...pin];
    newPinArray[index] = value;
    setPin(newPinArray);
    setError(false);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      handleSubmit(newPinArray.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newPinArray = [...pin];
      newPinArray[index - 1] = '';
      setPin(newPinArray);
    }
    if (e.key === 'Enter') {
      const fullPin = pin.join('');
      if (fullPin.length >= 4) {
        handleSubmit(fullPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newPinArray = [...pin];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newPinArray[i] = pasted[i];
    }
    setPin(newPinArray);
    if (pasted.length >= 4) {
      setTimeout(() => handleSubmit(newPinArray.join('')), 100);
    }
  };

  const handleSubmit = async (fullPin: string) => {
    const success = await unlock(fullPin);
    if (!success) {
      setError(true);
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
        setPin(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }, 500);
    }
  };

  // Trigger Recovery Code Generation and send email via EmailJS
  const sendRecoveryCode = async () => {
    if (!recoveryEmail) {
      setRecoveryError('No hay correo de recuperación configurado en el sistema.');
      return;
    }

    setLoadingEmail(true);
    setRecoveryError(null);

    // Generate random 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      // Import on demand to avoid SSR issues
      const emailjs = (await import('@emailjs/browser')).default;
      
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error("Faltan las credenciales de EmailJS en la configuración (.env.local)");
      }

      const templateParams = {
        to_email: recoveryEmail,
        code: code
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      setRecoverySuccess(`Código enviado automáticamente a ${recoveryEmail}. Revise su bandeja de entrada.`);
    } catch (err: any) {
      console.error(err);
      setRecoveryError('Error enviando el correo: ' + (err.message || 'Intente nuevamente.'));
      
      // Fallback a mailto si falla o faltan credenciales
      const subject = encodeURIComponent('Código de recuperación de PIN - Sistema Residencial');
      const body = encodeURIComponent(`Hola,\n\nSu código temporal para restablecer el PIN de acceso al Sistema de Facturación Residencial es: ${code}\n\nSi no solicitó este cambio, por favor ignore este correo.`);
      const mailtoUrl = `mailto:${recoveryEmail}?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;
      setRecoverySuccess(`Se ha abierto su cliente de correo como método alternativo.`);
    }

    setLoadingEmail(false);
  };

  // Verify entered code
  const verifyCode = () => {
    setRecoveryError(null);
    if (verificationCode === generatedCode) {
      setIsCodeVerified(true);
      setRecoverySuccess('Código verificado con éxito. Ingrese su nuevo PIN.');
    } else {
      setRecoveryError('Código de verificación incorrecto.');
    }
  };

  // Save new PIN
  const updatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (newPin.length < 4) {
      setRecoveryError('El PIN debe tener al menos 4 dígitos.');
      return;
    }
    if (newPin !== confirmPin) {
      setRecoveryError('Los PIN no coinciden.');
      return;
    }

    try {
      // Direct update of the single config row in Supabase
      const { error: updateError } = await (supabase.from('configuracion') as any)
        .update({ password_hash: newPin, actualizado_en: new Date().toISOString() })
        .eq('id', 1);

      if (updateError) throw updateError;

      // Reload page to re-fetch config/PIN context
      window.location.reload();
    } catch (err: any) {
      setRecoveryError(err.message || 'Error al actualizar el PIN.');
    }
  };

  const maskedEmail = recoveryEmail
    ? recoveryEmail.replace(/(.{3})(.*)(@.*)/, '$1***$3')
    : null;

  return (
    <div className="lockscreen">
      <div className="lockscreen-card">
        {/* Circle Wrapped Logo to match requested circular frame */}
        <div className="lockscreen-logo-circle-container">
          <img
            src="/logo.png"
            alt="Logo del Residencial"
            className="lockscreen-logo-circle-image"
          />
        </div>

        {!isRecovering ? (
          <>
            <h1 className="lockscreen-title">Sistema Residencial</h1>
            <p className="lockscreen-subtitle">Ingrese su PIN de acceso para desbloquear el sistema</p>

            {/* PIN Grid */}
            <div className="lockscreen-pin-row" onPaste={handlePaste}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`lockscreen-pin-input ${error ? 'lockscreen-pin-error' : ''} ${digit ? 'lockscreen-pin-filled' : ''} ${shaking ? 'lockscreen-shake' : ''}`}
                  autoComplete="off"
                />
              ))}
            </div>

            {error && (
              <div className="lockscreen-error-message">
                <AlertCircle size={15} />
                <span>Código PIN incorrecto</span>
              </div>
            )}

            <div className="lockscreen-footer-actions">
              {maskedEmail ? (
                <button 
                  onClick={() => setIsRecovering(true)}
                  className="lockscreen-action-link"
                >
                  ¿Olvidó su PIN?
                </button>
              ) : (
                <span className="text-muted text-xs">PIN por defecto: 123456</span>
              )}
            </div>
          </>
        ) : (
          /* Password Recovery Interface */
          <div className="lockscreen-recovery-box">
            <h2 className="lockscreen-title">Recuperación de PIN</h2>
            <p className="lockscreen-subtitle">
              Siga los pasos para restablecer su código de acceso.
            </p>

            {recoveryError && (
              <div className="alert alert-warning text-xs py-2 px-3 mb-3">
                <AlertCircle size={14} />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="alert alert-success text-xs py-2 px-3 mb-3">
                <CheckCircle size={14} />
                <span>{recoverySuccess}</span>
              </div>
            )}

            {/* STEP 1: Code generation and delivery */}
            {!generatedCode && (
              <div className="section-gap">
                <p className="text-xs text-gray-500 text-center mb-2">
                  Se enviará un código temporal al correo electrónico configurado: <br />
                  <strong className="text-gray-700 font-mono text-sm">{maskedEmail}</strong>
                </p>
                <button
                  onClick={sendRecoveryCode}
                  disabled={loadingEmail}
                  className="btn btn-primary w-full justify-center"
                >
                  <Mail size={16} />
                  {loadingEmail ? 'Generando...' : 'Abrir Correo y Enviar Código'}
                </button>
              </div>
            )}

            {/* STEP 2: Code Verification */}
            {generatedCode && !isCodeVerified && (
              <div className="section-gap">
                <div className="form-group">
                  <label className="form-label text-left text-xs">Ingrese el código temporal (6 dígitos):</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="form-input text-center font-mono tracking-widest text-lg"
                    placeholder="000000"
                  />
                </div>
                <button
                  onClick={verifyCode}
                  className="btn btn-primary w-full justify-center"
                >
                  <Key size={16} />
                  Verificar Código
                </button>
                <button
                  onClick={sendRecoveryCode}
                  className="btn btn-ghost text-xs w-full text-center"
                >
                  <RefreshCw size={12} />
                  Reenviar correo
                </button>
              </div>
            )}

            {/* STEP 3: Enter New PIN */}
            {isCodeVerified && (
              <form onSubmit={updatePin} className="section-gap">
                <div className="form-group">
                  <label className="form-label text-left text-xs">Nuevo PIN de Acceso</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="form-input text-center font-mono tracking-widest text-lg"
                    placeholder="Min 4 dígitos"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-left text-xs">Confirmar Nuevo PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="form-input text-center font-mono tracking-widest text-lg"
                    placeholder="Confirme su PIN"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-full justify-center"
                >
                  Restablecer y Entrar
                </button>
              </form>
            )}

            <button
              onClick={() => {
                setIsRecovering(false);
                setGeneratedCode(null);
                setIsCodeVerified(false);
                setVerificationCode('');
                setRecoveryError(null);
                setRecoverySuccess(null);
              }}
              className="btn btn-outline w-full justify-center mt-3 text-xs"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
