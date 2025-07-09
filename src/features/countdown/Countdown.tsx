import React, { useState, useEffect } from 'react';
import { getCountdowns } from '../../lib/supabase';
import { useAuth } from '../auth/AuthGate';

interface CountdownData {
  id: string;
  title: string;
  targetDate: Date;
  color: string;
  icon: string;
  description: string;
}

export const Countdown: React.FC = () => {
  const { userData } = useAuth();
  const [countdowns, setCountdowns] = useState<{ [key: string]: { days: number; hours: number; minutes: number; seconds: number } }>({});
  const [countdownData, setCountdownData] = useState<CountdownData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountdowns = async () => {
      if (!userData?.user_id) return;
      setLoading(true);
      const dbCountdowns = await getCountdowns(userData.user_id);
      // Mappe DB-Countdowns auf das CountdownData-Format
      const mapped = dbCountdowns.map((c, idx) => ({
        id: c.id.toString(),
        title: c.title,
        targetDate: new Date(c.target_date),
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ff69b4', '#ffd700'][idx % 5], // Farben rotieren
        icon: ['⏰', '✈️', '🐭', '👋', '💕'][idx % 5], // Icons rotieren
        description: 'Countdown läuft...'
      }));
      setCountdownData(mapped);
      setLoading(false);
    };
    fetchCountdowns();
  }, [userData]);

  useEffect(() => {
    if (countdownData.length === 0) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const newCountdowns: { [key: string]: { days: number; hours: number; minutes: number; seconds: number } } = {};
      countdownData.forEach(countdown => {
        const distance = countdown.targetDate.getTime() - now;
        if (distance > 0) {
          newCountdowns[countdown.id] = {
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          };
        } else {
          newCountdowns[countdown.id] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownData]);

  const TimeUnit: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
    <div style={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
      border: `2px solid ${color}30`,
      borderRadius: 12,
      padding: 12,
      textAlign: 'center',
      minWidth: 60
    }}>
      <div style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: color,
        marginBottom: 2
      }}>
        {value.toString().padStart(2, '0')}
      </div>
      <div style={{
        fontSize: 10,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5
      }}>
        {label}
      </div>
    </div>
  );

  const CountdownCard: React.FC<{ data: CountdownData; timeLeft: { days: number; hours: number; minutes: number; seconds: number } }> = ({ data, timeLeft }) => {
    const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;
    
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        border: `2px solid ${data.color}30`,
        boxShadow: `0 8px 32px ${data.color}20`,
        backdropFilter: 'blur(10px)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16
        }}>
          <div style={{ fontSize: 32 }}>{data.icon}</div>
          <div>
            <h3 style={{
              color: data.color,
              margin: '0 0 4px 0',
              fontSize: 18,
              fontWeight: 'bold'
            }}>
              {data.title}
            </h3>
            {/* Datum und Uhrzeit anzeigen */}
            <div style={{
              color: '#888',
              fontSize: 12,
              marginBottom: 2
            }}>
              {data.targetDate.toLocaleString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </div>
            <p style={{
              color: '#666',
              margin: 0,
              fontSize: 12
            }}>
              {data.description}
            </p>
          </div>
        </div>

        {/* Countdown Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 16
        }}>
          <TimeUnit value={timeLeft.days} label="Tage" color={data.color} />
          <TimeUnit value={timeLeft.hours} label="Std" color={data.color} />
          <TimeUnit value={timeLeft.minutes} label="Min" color={data.color} />
          <TimeUnit value={timeLeft.seconds} label="Sek" color={data.color} />
        </div>

        {/* Status Message */}
        <div style={{
          textAlign: 'center',
          padding: '12px 0',
          borderTop: `1px solid ${data.color}20`
        }}>
          {isExpired ? (
            <p style={{
              margin: 0,
              color: data.color,
              fontSize: 14,
              fontWeight: 'bold'
            }}>
              ✅ {data.title} ist erreicht!
            </p>
          ) : (
            <p style={{
              margin: 0,
              color: '#666',
              fontSize: 12,
              fontStyle: 'italic'
            }}>
              Noch {timeLeft.days} Tage, {timeLeft.hours} Stunden, {timeLeft.minutes} Minuten und {timeLeft.seconds} Sekunden
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '20px 16px',
      maxWidth: 800,
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 32,
        padding: '20px 0'
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏰</div>
        <h1 style={{ 
          color: '#ff69b4', 
          margin: '0 0 8px 0', 
          fontSize: 28, 
          fontWeight: 'bold'
        }}>
          Deine Countdowns
        </h1>
        <p style={{ 
          color: '#666', 
          margin: 0, 
          fontSize: 16,
          lineHeight: 1.5
        }}>
          Alle Countdowns aus deiner Datenbank!
        </p>
      </div>
      {loading ? (
        <div>Countowns werden geladen...</div>
      ) : (
        <div style={{ marginBottom: 32 }}>
          {countdownData.length === 0 ? (
            <div>Keine Countdowns gefunden.</div>
          ) : (
            countdownData.map(data => (
              <CountdownCard
                key={data.id}
                data={data}
                timeLeft={countdowns[data.id] || { days: 0, hours: 0, minutes: 0, seconds: 0 }}
              />
            ))
          )}
        </div>
      )}

      {/* Motivational Message */}
      <div style={{
        background: 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
        borderRadius: 20,
        padding: 24,
        textAlign: 'center',
        color: '#fff',
        marginBottom: 32
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💕</div>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: 20,
          fontWeight: 'bold'
        }}>
          Bald sind wir wieder zusammen!
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: 16,
          opacity: 0.9,
          lineHeight: 1.5
        }}>
          Jeder Tag bringt uns näher an unser Wiedersehen. Ich zähle jede Sekunde! ✨
        </p>
      </div>

      {/* Progress Overview */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 20,
        border: '2px solid #ffb6c1'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <span style={{ 
            color: '#ff69b4',
            fontWeight: 'bold',
            fontSize: 16
          }}>
            Nächster Meilenstein
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 0'
        }}>
          {(() => {
            const now = new Date().getTime();
            const nextMilestone = countdownData
              .filter(cd => cd.targetDate.getTime() > now)
              .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())[0];
            
            if (nextMilestone) {
              const timeLeft = countdowns[nextMilestone.id];
              return (
                <>
                  <div style={{ fontSize: 24 }}>{nextMilestone.icon}</div>
                  <div>
                    <div style={{ color: nextMilestone.color, fontWeight: 'bold', fontSize: 14 }}>
                      {nextMilestone.title}
                    </div>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      {timeLeft ? `${timeLeft.days} Tage, ${timeLeft.hours} Stunden` : 'Berechne...'}
                    </div>
                  </div>
                </>
              );
            }
            return (
              <div style={{ color: '#666', fontSize: 14 }}>
                Alle Meilensteine erreicht! 🎉
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}; 