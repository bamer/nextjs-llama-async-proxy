import type { ConfigType } from "@/components/ui/ModelConfigDialog";

export interface ParamDescription {
  description: string;
  recommended: string;
  effect: string;
  whenToAdjust: string;
}

export const PARAM_DESCRIPTIONS: Record<ConfigType, Record<string, ParamDescription>> = {
  sampling: {
    temperature: {
      description: "Contrôle l'aléatoire dans la sélection de tokens. Plus élevé = plus créatif, plus bas = plus focalisé.",
      recommended: "0.0-2.0 (par défaut : 0.7)",
      effect: "Des valeurs plus élevées augmentent la créativité mais peuvent réduire la cohérence. Des valeurs plus basses produisent des résultats plus prévisibles.",
      whenToAdjust: "Augmentez pour l'écriture créative. Diminuez pour la génération de code ou les réponses factuelles.",
    },
    top_k: {
      description: "Limite l'échantillonnage aux K tokens les plus probables.",
      recommended: "1-100 (par défaut : 40)",
      effect: "Des valeurs plus basses restreignent la diversité de sortie. Des valeurs plus élevées permettent un vocabulaire plus varié.",
      whenToAdjust: "Diminuez pour des sorties déterministes. Augmentez pour réduire la répétition ou ajouter de la variété.",
    },
    top_p: {
      description: "Échantillonnage par noyau : échantillonne à partir du plus petit ensemble de tokens dont la probabilité cumulée dépasse P.",
      recommended: "0.1-1.0 (par défaut : 0.9)",
      effect: "Des valeurs plus basses créent des sorties focalisées. Des valeurs plus élevées permettent des réponses plus créatives.",
      whenToAdjust: "Diminuez pour des sorties focalisées. Augmentez pour des tâches créatives nécessitant de la variété.",
    },
    min_p: {
      description: "Seuil de probabilité minimum pour la sélection de tokens.",
      recommended: "0.0-0.5 (par défaut : 0.05)",
      effect: "Filtre les tokens de très faible probabilité, réduisant le contenu incohérent.",
      whenToAdjust: "Augmentez pour filtrer plus de tokens de faible probabilité et améliorer la qualité.",
    },
    repeat_last_n: {
      description: "Nombre des derniers tokens à considérer pour les pénalités de répétition.",
      recommended: "0-2048 (par défaut : 64)",
      effect: "Contrôle la fenêtre glissante pour la détection de motifs répétitifs. Des fenêtres plus grandes détectent des répétitions plus lointaines.",
      whenToAdjust: "Augmentez pour le contrôle de répétition à long terme. Diminuez pour le contrôle à court terme.",
    },
    repeat_penalty: {
      description: "Pénalité pour les tokens répétés.",
      recommended: "1.0-2.0 (par défaut : 1.0)",
      effect: "Les valeurs >1.0 réduisent les boucles. 1.0 désactive la pénalité. Trop élevé brise le flux.",
      whenToAdjust: "Augmentez quand le modèle se répète. Diminuez si la sortie devient artificielle.",
    },
    presence_penalty: {
      description: "Pénalise les tokens déjà présents dans le texte généré, encourageant la variété.",
      recommended: "0.0-2.0 (par défaut : 0)",
      effect: "Encourage de nouveaux sujets et vocabulaire. Trop élevé rend les réponses incohérentes.",
      whenToAdjust: "Utilisez pour encourager un vocabulaire diversifié et éviter les sujets bloqués.",
    },
    frequency_penalty: {
      description: "Pénalise les tokens en fonction de leur fréquence d'apparition.",
      recommended: "0.0-2.0 (par défaut : 0)",
      effect: "Plus agressif que la pénalité de présence, pénalisant fortement les mots fréquents.",
      whenToAdjust: "Quand la pénalité de présence ne suffit pas à réduire la répétition de mots.",
    },
    mirostat: {
      description: "Algorithme Mirostat : 0=désactivé, 1=Mirostat, 2=Mirostat 2.0.",
      recommended: "0, 1, ou 2 (par défaut : 0)",
      effect: "Maintient une perplexité constante pour une qualité de texte cohérente.",
      whenToAdjust: "Utilisez pour une sortie de haute qualité constante avec une perplexité contrôlée.",
    },
    seed: {
      description: "Graine aléatoire pour la génération. -1 utilise le hasard.",
      recommended: "-1 ou entier positif (par défaut : -1)",
      effect: "La même graine avec les mêmes paramètres produit une sortie identique.",
      whenToAdjust: "Définissez pour des sorties reproductibles lors des tests ou du débogage.",
    },
  },
  memory: {
    cache_ram: {
      description: "RAM à allouer pour le cache KV en Go. 0 utilise le dimensionnement automatique.",
      recommended: "0 ou Go positifs (par défaut : 0)",
      effect: "Contrôle la quantité de contexte de modèle conservée en RAM rapide.",
      whenToAdjust: "Définissez manuellement si le dimensionnement automatique n'est pas optimal pour votre système.",
    },
    mmap: {
      description: "Utiliser des fichiers mappés en mémoire pour les poids du modèle. 0=désactivé, 1=activé.",
      recommended: "0 ou 1 (par défaut : 1)",
      effect: "MMap réduit la RAM mais peut être plus lent. Désactiver charge tout en RAM.",
      whenToAdjust: "Désactivez pour la vitesse avec suffisamment de RAM. Activez pour économiser la mémoire.",
    },
    mlock: {
      description: "Verrouille le modèle en RAM pour empêcher le swapping. 0=désactivé, 1=activé.",
      recommended: "0 ou 1 (par défaut : 0)",
      effect: "Empêche le swapping sur disque, améliorant les performances.",
      whenToAdjust: "Activez si le système swap le modèle sur disque dégradant les performances.",
    },
  },
  gpu: {
    gpu_layers: {
      description: "Nombre de couches à décharger sur le GPU. -1 décharge toutes les possibles.",
      recommended: "-1 ou 0-n (par défaut : -1)",
      effect: "Plus de couches = inférence plus rapide mais plus de VRAM utilisée.",
      whenToAdjust: "Diminuez si manque de VRAM. Augmentez pour la vitesse maximale.",
    },
    main_gpu: {
      description: "GPU principal pour les opérations principales du modèle.",
      recommended: "Index du GPU (par défaut : 0)",
      effect: "Spécifie quel GPU gère le calcul principal.",
      whenToAdjust: "Définissez sur le GPU le plus rapide dans les configurations multi-GPU hétérogènes.",
    },
    kv_offload: {
      description: "Décharger le cache KV sur le GPU. 0=désactivé, 1=activé.",
      recommended: "0 ou 1 (par défaut : 0)",
      effect: "Améliore la vitesse mais utilise la VRAM.",
      whenToAdjust: "Activez si vous avez de la VRAM disponible pour une inférence plus rapide.",
    },
  },
  advanced: {
    context_shift: {
      description: "Activer le décalage de fenêtre de contexte. 0=désactivé, 1=activé.",
      recommended: "0 ou 1 (par défaut : 0)",
      effect: "Permet de gérer des séquences plus longues que la fenêtre de contexte du modèle.",
      whenToAdjust: "Activez lors du travail avec des entrées très longues.",
    },
    flash_attn: {
      description: "Utiliser l'attention flash pour une inférence plus rapide. 0=désactivé, 1=activé.",
      recommended: "0 ou 1 (par défaut : vide)",
      effect: "Accélère considérablement le calcul d'attention lorsque supporté.",
      whenToAdjust: "Activez si le GPU supporte l'attention Flash pour une génération plus rapide.",
    },
    check_tensors: {
      description: "Valider les tenseurs. 0=désactivé, 1=activé.",
      recommended: "0 ou 1 (par défaut : 0)",
      effect: "Effectue des vérifications de validation des tenseurs.",
      whenToAdjust: "Activez pour le débogage des problèmes de chargement de modèle.",
    },
    sleep_idle_seconds: {
      description: "Secondes d'inactivité avant mise en veille. 0=désactivé.",
      recommended: "0-3600 (par défaut : 0)",
      effect: "Contrôle le délai d'inactivité pour la gestion des ressources.",
      whenToAdjust: "Définissez pour libérer les ressources après inactivité.",
    },
  },
  lora: {
    lora: {
      description: "Chemin vers le fichier d'adaptateur LoRA.",
      recommended: "Chemin de fichier vers fichier LoRA .gguf",
      effect: "Applique l'adaptateur LoRA pour modifier le comportement du modèle et le spécialiser.",
      whenToAdjust: "Utilisez pour affiner le modèle pour des tâches ou styles spécifiques.",
    },
    draft_max: {
      description: "Nombre maximum de tokens à rédiger dans le décodage spéculatif.",
      recommended: "1-64 (par défaut : 16)",
      effect: "Limite la longueur de rédaction du décodage spéculatif.",
      whenToAdjust: "Ajustez en fonction du taux d'acceptation et des performances.",
    },
    draft_min: {
      description: "Nombre minimum de tokens à rédiger dans le décodage spéculatif.",
      recommended: "1-32 (par défaut : 5)",
      effect: "Assure une longueur minimum de rédaction pour le décodage spéculatif.",
      whenToAdjust: "Définissez en fonction des caractéristiques d'acceptation.",
    },
  },
  multimodal: {
    mmproj: {
      description: "Chemin vers le modèle de projection multimodal (encodeur CLIP).",
      recommended: "Chemin de fichier vers fichier mmproj .gguf",
      effect: "Active les capacités de vision en chargeant le modèle de projection.",
      whenToAdjust: "Chargez lors de l'utilisation des fonctionnalités de vision.",
    },
    image_max_tokens: {
      description: "Nombre maximum de tokens par encodage d'image.",
      recommended: "0-8192 (par défaut : 0)",
      effect: "Limite la longueur d'encodage maximum pour les images.",
      whenToAdjust: "Augmentez pour une compréhension d'image plus détaillée.",
    },
    mmproj_auto: {
      description: "Détection automatique du modèle multimodal. 0=désactivé, 1=activé.",
      recommended: "0 ou 1 (par défaut : 0)",
      effect: "Trouve automatiquement le modèle de projection.",
      whenToAdjust: "Activez pour une configuration multimodal plus facile.",
    },
  },
};

export function getParamDescription(configType: ConfigType, fieldName: string): ParamDescription | undefined {
  return PARAM_DESCRIPTIONS[configType]?.[fieldName];
}
