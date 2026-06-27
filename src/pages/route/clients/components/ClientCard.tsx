import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { addCircle, card, create, trash, eye, eyeOff } from 'ionicons/icons';
import { Client } from '../../../../services/clientApi';
import { getCreditsByClient } from '../../../../services/creditApi';
import InfoRow from '../../../../components/ui/InfoRow';
import ActionButton from '../../../../components/ui/ActionButton';
import { useTranslation } from 'react-i18next';

interface ClientCardProps {
  client: Client;
  onAddCredit: (client: Client) => void;
  onViewCredits: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  formatCurrency: (value: number) => string;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onAddCredit,
  onViewCredits,
  onEdit,
  onDelete,
  formatCurrency
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [credits, setCredits] = useState<any[]>([]);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const clientCredits = await getCreditsByClient(client.id);
        setCredits(clientCredits);
      } catch (error) {
        console.error('Erro ao carregar créditos do cliente:', error);
        setCredits([]);
      }
    };
    loadCredits();
  }, [client.id]);

  const totalDebt = credits.reduce((sum, credit) => sum + credit.totalDebt, 0);

  return (
    <div style={{
      marginBottom: '16px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        backgroundColor: '#0c0989',
        borderRadius: '16px 0 0 16px'
      }} />

      <div style={{ paddingLeft: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#262626' }}>
            {client.name}
          </h2>
          {client.creditsCount > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#0c0989',
              backgroundColor: '#e8f5e9',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              {client.creditsCount} {t('pages.clients.credits')}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <InfoRow
            label={t('pages.clients.totalDebt')}
            value={formatCurrency(totalDebt)}
            valueColor={totalDebt > 0 ? '#262626' : '#999'}
          />
          <InfoRow
            label={t('pages.clients.debits')}
            value={String(client.debitsCount)}
            showBorder={false}
          />
        </div>

        <div
          onClick={() => setShowDetails(!showDetails)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '8px 0',
            marginBottom: showDetails ? '8px' : '16px',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <IonIcon icon={showDetails ? eyeOff : eye} style={{ fontSize: '16px', color: '#0c0989' }} />
          <span style={{ fontSize: '13px', color: '#0c0989', fontWeight: 600 }}>
            {showDetails ? t('common.hide') : t('common.show')}
          </span>
        </div>

        {showDetails && (
          <div style={{ marginBottom: '16px' }}>
            <InfoRow label={t('pages.clients.cpf')} value={client.cpf || t('pages.clients.notProvided')} />
            <InfoRow label={t('pages.clients.phone')} value={client.phone || t('pages.clients.notProvided')} />
            <InfoRow label={t('pages.clients.shop')} value={client.shop || t('pages.clients.notProvidedFemale')} />
            <InfoRow label={t('pages.clients.address')} value={client.address || t('pages.clients.notProvided')} showBorder={false} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 30%', minWidth: 0 }}>
            <ActionButton
              icon={addCircle}
              label={t('pages.clients.addCredit')}
              onClick={() => onAddCredit(client)}
              backgroundColor="#e8f5e9"
              color="#2e7d32"
            />
          </div>
          <div style={{ flex: '1 1 30%', minWidth: 0 }}>
            <ActionButton
              icon={card}
              label={t('pages.clients.viewCredits')}
              onClick={() => onViewCredits(client)}
            />
          </div>
          <div style={{ flex: '1 1 30%', minWidth: 0 }}>
            <ActionButton
              icon={create}
              label={t('common.edit')}
              onClick={() => onEdit(client)}
            />
          </div>
          <div style={{ flex: '1 1 30%', minWidth: 0 }}>
            <ActionButton
              icon={trash}
              label={t('common.delete')}
              onClick={() => onDelete(client)}
              backgroundColor="#fff5f5"
              color="#dc3545"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
