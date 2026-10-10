import styles from './Layout.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        Dados oficiais do Tribunal Superior Eleitoral (TSE), atualizados automaticamente. Site
        independente, sem vínculo com o TSE ou com candidatos.
      </p>
    </footer>
  );
}
